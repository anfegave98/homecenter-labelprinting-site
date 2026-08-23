import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiError, ApiResponse } from '../../shared/models/api-response.model';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Traduce los fallos HTTP a un `ApiError` con mensaje presentable.
 *
 * Importa lo que este interceptor NO hace: un rechazo de regla de negocio llega como
 * HTTP 200 con `success: false` y por lo tanto nunca pasa por aqui. Rechazar una
 * impresion por inventario no es un error tecnico, y mezclarlos haria que la UI
 * mostrara "algo salio mal" cuando en realidad el sistema funciono correctamente.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((response: HttpErrorResponse) => {
      // Si el backend ya envio su envelope de error, se respeta su mensaje.
      const envelope = response.error as ApiResponse<unknown> | undefined;
      const backendError = envelope?.error ?? null;

      if (response.status === 401) {
        // El token expiro o dejo de ser valido: la sesion local ya no sirve.
        tokenStorage.clear();
        void router.navigate(['/login'], { queryParams: { expired: true } });
      }

      return throwError(() => backendError ?? buildError(response));
    })
  );
};

/** Construye un mensaje entendible cuando el backend no alcanzo a responder. */
function buildError(response: HttpErrorResponse): ApiError {
  switch (response.status) {
    case 0:
      // Render suspende el servicio gratuito por inactividad: el primer intento
      // tras el reposo falla o tarda. Decirlo es mas util que un "error de red".
      return {
        code: 'NETWORK_UNAVAILABLE',
        message:
          'No fue posible contactar el servicio. Si es la primera solicitud del dia, ' +
          'el servidor puede estar reactivandose: intenta de nuevo en unos segundos.'
      };
    case 401:
      return { code: 'UNAUTHORIZED', message: 'Tu sesion expiro. Ingresa de nuevo.' };
    case 403:
      return {
        code: 'FORBIDDEN',
        message: 'Tu rol no tiene permiso para ejecutar esta accion.'
      };
    case 404:
      return { code: 'NOT_FOUND', message: 'El recurso solicitado no existe.' };
    case 429:
      return {
        code: 'RATE_LIMITED',
        message: 'Se supero el limite de solicitudes. Espera un momento antes de reintentar.'
      };
    default:
      return {
        code: 'UNEXPECTED_ERROR',
        message: 'Ocurrio un error inesperado al procesar la solicitud.'
      };
  }
}
