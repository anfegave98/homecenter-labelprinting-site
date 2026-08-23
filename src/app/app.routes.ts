import { Routes } from '@angular/router';

import { LoginComponent } from './auth/components/login/login.component';
import { authGuard } from './auth/guards/auth.guard';
import { HistoryPageComponent } from './printing/components/history-page/history-page.component';
import { PrintPageComponent } from './printing/components/print-page/print-page.component';

/**
 * Rutas de la aplicacion.
 * Las vistas internas exigen sesion mediante `authGuard`; el alcance de lo que
 * muestra el historial lo impone el backend segun el rol, no estas rutas.
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
  {
    path: 'historial',
    component: HistoryPageComponent,
    canActivate: [authGuard],
    title: 'Historial de impresiones'
  },
  { path: '**', redirectTo: 'impresion' }
];
