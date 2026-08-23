import { Routes } from '@angular/router';

import { LoginComponent } from './auth/components/login/login.component';
import { authGuard } from './auth/guards/auth.guard';
import { PrintPageComponent } from './printing/components/print-page/print-page.component';

/**
 * Rutas de la aplicacion.
 * Las vistas internas exigen sesion mediante `authGuard`; el historial (HU-008) se
 * incorpora en su bloque correspondiente.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'impresion' },
  { path: 'login', component: LoginComponent, title: 'Ingresar · Impresión de ETQ' },
  {
    path: 'impresion',
    component: PrintPageComponent,
    canActivate: [authGuard],
    title: 'Impresión de etiqueta'
  },
  { path: '**', redirectTo: 'impresion' }
];
