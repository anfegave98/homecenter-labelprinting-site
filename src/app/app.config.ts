import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { errorInterceptor } from './auth/interceptors/error.interceptor';
import { jwtInterceptor } from './auth/interceptors/jwt.interceptor';
import { ApprovalsFacade } from './printing/facades/approvals.facade';
import { HistoryFacade } from './printing/facades/history.facade';
import { PrintingFacade } from './printing/facades/printing.facade';
import { SESSION_SCOPED_STATE } from './shared/state/session-scoped-state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // El orden importa: el token se adjunta antes de enviar y los fallos se traducen
    // en el camino de vuelta.
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),

    // Fachadas cuyo estado muere con la sesion. Sin este registro, lo que consulto un
    // usuario queda en memoria y lo ve el siguiente: son singletons de raiz, viven
    // mientras viva la pestaña. Una funcionalidad nueva con estado se suma aqui.
    { provide: SESSION_SCOPED_STATE, useExisting: PrintingFacade, multi: true },
    { provide: SESSION_SCOPED_STATE, useExisting: HistoryFacade, multi: true },
    { provide: SESSION_SCOPED_STATE, useExisting: ApprovalsFacade, multi: true }
  ]
};
