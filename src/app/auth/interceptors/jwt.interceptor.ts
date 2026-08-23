import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Adjunta el token a las peticiones dirigidas al API.
 *
 * El filtro por `apiUrl` es intencional: enviar el `Authorization` a cualquier host
 * filtraria la credencial a terceros si en el futuro se consume otro servicio.
 */
export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenStorageService).getToken();

  if (!token || !request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  return next(
    request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
