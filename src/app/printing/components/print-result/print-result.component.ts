import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ApiError } from '../../../shared/models/api-response.model';
import { AlertComponent } from '../../../shared/ui/alert.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { InventoryShortageDto, PrintResultDto } from '../../models/printing.models';

/**
 * Resultado de la solicitud: aprobada o rechazada, con su motivo.
 *
 * Un rechazo se presenta como una respuesta legitima del sistema y no como una falla:
 * el operario necesita saber que producto o que estado lo bloqueo para poder actuar.
 */
@Component({
  selector: 'app-print-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, AlertComponent, BadgeComponent],
  templateUrl: './print-result.component.html'
})
export class PrintResultComponent {
  /** Resultado devuelto por el API, si la solicitud llego a procesarse. */
  readonly result = input<PrintResultDto | null>(null);

  /** Motivo del rechazo o del fallo tecnico. */
  readonly rejection = input<ApiError | null>(null);

  /** Indica si la solicitud fue aprobada. */
  protected readonly approved = computed(() => this.rejection() === null && this.result() !== null);

  /**
   * Indica que la solicitud quedo esperando autorizacion.
   *
   * Se distingue del rechazo a proposito: al operario le cambia lo que debe hacer.
   * Ante un rechazo corrige y reintenta; aqui no tiene nada que corregir, solo esperar.
   */
  protected readonly pending = computed(() => this.result()?.result === 'PENDING_APPROVAL');

  /** Indica si el evento corresponde a una reimpresion. */
  protected readonly isReprint = computed(() => this.result()?.eventType === 'REPRINT');

  /**
   * Detalle por producto que acompana un rechazo de inventario.
   * El backend lo envia en `error.details`; solo las reglas de inventario lo llenan.
   */
  protected readonly shortages = computed<InventoryShortageDto[]>(() => {
    const details = this.rejection()?.details;
    return Array.isArray(details) ? (details as InventoryShortageDto[]) : [];
  });
}
