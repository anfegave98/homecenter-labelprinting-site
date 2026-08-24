import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  SESSION_SCOPED_STATE,
  SessionScopedState
} from '../../shared/state/session-scoped-state';
import { AuthFacade } from './auth.facade';

/** Doble que solo cuenta cuantas veces le pidieron limpiarse. */
class EstadoDeSesionEspia implements SessionScopedState {
  veces = 0;

  resetForNewSession(): void {
    this.veces += 1;
  }
}

/**
 * Limpieza del estado entre sesiones.
 *
 * Existe por un fallo real: las fachadas son singletons de raiz y sobreviven al
 * cierre de sesion, de modo que la ETQ consultada, el resultado de la impresion y
 * las filas del historial quedaban visibles para el siguiente usuario.
 */
describe('AuthFacade · estado entre sesiones', () => {
  let facade: AuthFacade;
  let http: HttpTestingController;
  let espia: EstadoDeSesionEspia;

  beforeEach(() => {
    espia = new EstadoDeSesionEspia();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SESSION_SCOPED_STATE, useValue: espia, multi: true }
      ]
    });

    facade = TestBed.inject(AuthFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('descarta el estado de la sesion anterior al cerrar sesion', () => {
    facade.logout();

    expect(espia.veces).toBe(1);
  });

  it('descarta el estado de la sesion anterior al ingresar', async () => {
    // El interceptor de errores tambien termina sesiones ante un 401 y no pasa por
    // logout(). Limpiar al ingresar cubre ese camino.
    facade.login({ userName: 'operario.tienda', password: 'x' }).subscribe();

    // AuthService arma el cuerpo de forma asincrona —puede cifrar las credenciales—,
    // asi que la peticion se emite en un microtask posterior a la suscripcion.
    await Promise.resolve();

    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      success: true,
      data: {
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { id: 1, userName: 'operario.tienda', fullName: 'Operario Tienda 01', roles: ['Operario'] }
      },
      error: null,
      meta: null
    });

    expect(espia.veces).toBe(1);
    expect(facade.user()?.userName).toBe('operario.tienda');
  });

  it('deja la sesion sin usuario tras cerrarla', () => {
    facade.logout();

    expect(facade.user()).toBeNull();
    expect(facade.isAuthenticated()).toBeFalse();
  });
});
