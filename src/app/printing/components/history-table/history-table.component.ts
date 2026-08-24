import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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

  /** Solicitud cuya etiqueta se esta descargando, si hay alguna. */
  readonly downloading = input<number | null>(null);

  /** Solicita la entrega del archivo de una solicitud. */
  readonly download = output<number>();

  /**
   * Indica si la fila ofrece descarga.
   *
   * Solo las aprobadas tienen etiqueta que entregar, y solo una vez: una solicitud
   * aprobada da derecho a una copia, no a un boton permanente.
   */
  protected canDownload(item: PrintHistoryItemDto): boolean {
    return item.result === 'APPROVED' && !item.downloadedAt;
  }

  /** Tono del badge de resultado. */
  protected resultTone(result: string): BadgeTone {
    if (result === 'APPROVED') {
      return 'success';
    }

    // Una solicitud pendiente no es un fallo: pintarla de rojo junto a los rechazos
    // haria creer que ya se decidio en contra.
    return result === 'PENDING_APPROVAL' ? 'warning' : 'danger';
  }

  /** Etiqueta legible del resultado. */
  protected resultLabel(result: string): string {
    if (result === 'APPROVED') {
      return 'Aprobada';
    }

    return result === 'PENDING_APPROVAL' ? 'Pendiente' : 'Rechazada';
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
