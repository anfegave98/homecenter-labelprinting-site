import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BadgeComponent, BadgeTone } from '../../../shared/ui/badge.component';
import { PrintHistoryItemDto } from '../../models/printing.models';

/**
 * Historial de impresiones.
 *
 * En pantallas anchas se muestra como tabla y en movil como tarjetas. No es una tabla
 * con scroll horizontal: en el piso de tienda la consulta se hace desde un telefono,
 * y una tabla de diez columnas ahi es ilegible.
 */
@Component({
  selector: 'app-history-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, BadgeComponent],
  templateUrl: './history-table.component.html'
})
export class HistoryTableComponent {
  /** Registros de la pagina actual. */
  readonly items = input.required<PrintHistoryItemDto[]>();

  /** Tono del badge de resultado. */
  protected resultTone(result: string): BadgeTone {
    return result === 'APPROVED' ? 'success' : 'danger';
  }

  /** Etiqueta legible del resultado. */
  protected resultLabel(result: string): string {
    return result === 'APPROVED' ? 'Aprobada' : 'Rechazada';
  }

  /** Etiqueta legible del tipo de evento. */
  protected eventLabel(eventType: string): string {
    return eventType === 'REPRINT' ? 'Reimpresión' : 'Impresión';
  }

  /**
   * La reimpresion se destaca en ambar y no en gris: es el evento excepcional que
   * un supervisor revisa, y perderlo entre las impresiones normales anularia el
   * proposito de marcarlo.
   */
  protected eventTone(eventType: string): BadgeTone {
    return eventType === 'REPRINT' ? 'warning' : 'info';
  }
}
