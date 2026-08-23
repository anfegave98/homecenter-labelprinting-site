import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from '../facades/auth.facade';

/**
 * Impide entrar a las vistas internas sin sesion.
 * Es una comodidad de navegacion, no un control de seguridad: cada endpoint del API
 * valida el token por su cuenta.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
