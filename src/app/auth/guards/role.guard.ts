import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from '../facades/auth.facade';

/**
 * Restringe una ruta a los roles indicados en `data.roles`.
 * Igual que `authGuard`, solo evita mostrar una pantalla inutil: la autorizacion
 * definitiva la aplica el backend con `[Authorize(Roles = ...)]`.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  const allowedRoles = (route.data?.['roles'] as string[] | undefined) ?? [];

  if (allowedRoles.length === 0 || auth.hasAnyRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/impresion']);
};
