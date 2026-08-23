import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, tap } from 'rxjs';

import { AuthUserDto, LoginRequestDto, LoginResponseDto, RoleName } from '../models/auth.models';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Estado de sesion de la aplicacion.
 *
 * Los componentes consumen esta fachada y nunca el `HttpClient` directamente: el dia
 * que cambie el transporte, los componentes no se enteran.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly userSignal = signal<AuthUserDto | null>(this.tokenStorage.getUser());
  private readonly loadingSignal = signal(false);

  /** Usuario autenticado, o null si no hay sesion. */
  readonly user = this.userSignal.asReadonly();

  /** Indica si hay una autenticacion en curso. */
  readonly loading = this.loadingSignal.asReadonly();

  /** Indica si existe una sesion vigente. */
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /** Roles del usuario autenticado. */
  readonly roles = computed(() => this.userSignal()?.roles ?? []);

  /**
   * Indica si el usuario puede reimprimir.
   *
   * Es unicamente una ayuda de presentacion para mostrar u ocultar el campo de motivo:
   * la decision vinculante la toma la regla R4 en el backend. Si esta bandera y el
   * backend discrepan, manda el backend.
   */
  readonly canReprint = computed(
    () => this.hasRole(RoleName.Supervisor) || this.hasRole(RoleName.Admin)
  );

  /** Indica si el usuario tiene el rol indicado. */
  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  /** Indica si el usuario tiene al menos uno de los roles indicados. */
  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  /** Autentica al usuario y deja la sesion lista para las siguientes peticiones. */
  login(dto: LoginRequestDto): Observable<LoginResponseDto> {
    this.loadingSignal.set(true);

    return this.authService.login(dto).pipe(
      tap((response) => {
        this.tokenStorage.save(response.accessToken, response.user, response.expiresIn);
        this.userSignal.set(response.user);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** Cierra la sesion y devuelve al login. */
  logout(): void {
    this.tokenStorage.clear();
    this.userSignal.set(null);
    void this.router.navigate(['/login']);
  }
}
