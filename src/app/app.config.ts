import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { errorInterceptor } from './auth/interceptors/error.interceptor';
import { jwtInterceptor } from './auth/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // El orden importa: el token se adjunta antes de enviar y los fallos se traducen
    // en el camino de vuelta.
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
  ]
};
