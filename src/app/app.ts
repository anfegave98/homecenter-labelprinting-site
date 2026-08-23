import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthFacade } from './auth/facades/auth.facade';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Impresión de Etiquetas · Homecenter');

  /** Estado de sesion, para mostrar el usuario activo y permitir cerrar sesion. */
  protected readonly auth = inject(AuthFacade);
}
