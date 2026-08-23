import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiError, ApiResponse } from '../../shared/models/api-response.model';
import { TokenStorageService } from '../services/token-storage.service';

/** Header con el que el backend identifica cada solicitud. */
const CORRELATION_HEADER = 'X-Correlation-Id';

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

      const error = backendError ?? buildError(response);

      return throwError(() => withCorrelationId(error, response));
    })
  );
};

/**
 * Adjunta el identificador de correlacion al mensaje de un fallo tecnico.
 *
 * Sin esto el identificador existe en el log del servidor pero nadie puede citarlo:
 * el operario reportaria "no me dejo imprimir" y el soporte tendria que buscar por
 * hora aproximada. Solo se agrega a fallos inesperados; en un 403 o un 429 el usuario
 * ya sabe que paso y el codigo no le aporta nada.
 */
function withCorrelationId(error: ApiError, response: HttpErrorResponse): ApiError {
  const shouldAttach = response.status === 0 || response.status >= 500;
  const correlationId = response.headers?.get(CORRELATION_HEADER);

  if (!shouldAttach || !correlationId) {
    return error;
  }

  return { ...error, message: `${error.message} (referencia: ${correlationId})` };
}

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
      return { code: 'RATE_LIMITED', message: buildRateLimitMessage(response) };
    default:
      return {
        code: 'UNEXPECTED_ERROR',
        message: 'Ocurrio un error inesperado al procesar la solicitud.'
      };
  }
}

/**
 * Usa el header `Retry-After` para decir cuanto esperar.
 * Un "intenta mas tarde" sin cifra invita a reintentar de inmediato, que es
 * justamente lo que agrava la rafaga que el limite esta conteniendo.
 */
function buildRateLimitMessage(response: HttpErrorResponse): string {
  const retryAfter = Number(response.headers?.get('Retry-After'));

  return Number.isFinite(retryAfter) && retryAfter > 0
    ? `Se superó el límite de solicitudes. Reintenta en ${retryAfter} segundos.`
    : 'Se superó el límite de solicitudes. Espera un momento antes de reintentar.';
}
