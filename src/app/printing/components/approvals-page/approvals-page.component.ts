import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { AlertComponent } from '../../../shared/ui/alert.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { BrandLoaderComponent } from '../../../shared/ui/brand-loader.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PaginationComponent } from '../../../shared/ui/pagination.component';
import { ApprovalsFacade } from '../../facades/approvals.facade';

/**
 * Bandeja de reimpresiones pendientes de autorizacion.
 *
 * Es la contraparte de HU-04: el operario detecta que la etiqueta se dano y pide la
 * reimpresion con su motivo; aqui un Supervisor o Admin la resuelve. Sin esta pantalla
 * el control por rol solo bloquearia al operario, sin darle salida.
 */
@Component({
  selector: 'app-approvals-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    AlertComponent,
    BadgeComponent,
    BrandLoaderComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './approvals-page.component.html'
})
export class ApprovalsPageComponent implements OnInit {
  /** Estado de la bandeja. */
  protected readonly approvals = inject(ApprovalsFacade);

  /**
   * Comentario que el autorizador escribe por solicitud.
   *
   * Se guarda por identificador y no en un solo campo compartido porque la bandeja
   * muestra varias solicitudes a la vez: un unico cuadro de texto haria que el motivo
   * escrito para una terminara enviado con otra.
   */
  private readonly notes = signal<Record<number, string>>({});

  /** Carga la bandeja al entrar. */
  ngOnInit(): void {
    this.approvals.load();
  }

  /** Comentario escrito para una solicitud. */
  protected noteFor(id: number): string {
    return this.notes()[id] ?? '';
  }

  /** Registra el comentario escrito para una solicitud. */
  protected setNote(id: number, value: string): void {
    this.notes.update((current) => ({ ...current, [id]: value }));
  }

  /** Autoriza la solicitud con el comentario escrito, si lo hay. */
  protected approve(id: number): void {
    const note = this.noteFor(id).trim();
    this.approvals.approve(id, note.length > 0 ? note : null);
    this.clearNote(id);
  }

  /** Niega la solicitud. El comentario es obligatorio y el boton se bloquea sin el. */
  protected reject(id: number): void {
    const note = this.noteFor(id).trim();
    if (note.length === 0) {
      return;
    }

    this.approvals.reject(id, note);
    this.clearNote(id);
  }

  private clearNote(id: number): void {
    this.notes.update((current) => {
      const { [id]: _removed, ...rest } = current;
      return rest;
    });
  }
}
