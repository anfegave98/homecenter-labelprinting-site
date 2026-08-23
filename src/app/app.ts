import { Component, computed, inject, signal } from '@angular/core';
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

  /**
   * Iniciales del usuario para el avatar.
   * Se derivan del nombre completo y no de la primera letra del usuario tecnico:
   * "OT" identifica a una persona, "o" de "operario.tienda" no dice nada.
   */
  protected readonly initials = computed(() => {
    const fullName = this.auth.user()?.fullName?.trim();
    if (!fullName) {
      return '··';
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });
}
