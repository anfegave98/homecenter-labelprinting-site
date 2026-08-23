import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BadgeComponent, BadgeTone } from '../../../shared/ui/badge.component';
import { LabelDetailDto, ProductAvailabilityDto } from '../../models/printing.models';

/**
 * Preview de la ETQ resuelta: documento origen, zona y productos con su disponibilidad.
 *
 * Lo que se muestra aqui es informativo. La validacion vinculante ocurre al imprimir,
 * porque entre la consulta y la impresion el inventario pudo cambiar: mostrar "listo
 * para imprimir" no es una promesa de que la impresion sera aprobada.
 */
@Component({
  selector: 'app-label-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './label-preview.component.html'
})
export class LabelPreviewComponent {
  /** Etiqueta resuelta que se va a mostrar. */
  readonly label = input.required<LabelDetailDto>();

  /** Tono del badge segun el estado del documento origen. */
  protected readonly statusTone = computed<BadgeTone>(() => {
    switch (this.label().document.status.toUpperCase()) {
      case 'ANULADA':
      case 'DEVUELTA':
        return 'danger';
      case 'LIBERADA':
        return 'success';
      default:
        return 'info';
    }
  });

  /** Explica por que un producto no es elegible en la zona consultada. */
  protected shortageReason(product: ProductAvailabilityDto): string {
    if (!product.isStocked) {
      return 'No abastecido en la zona';
    }

    if (product.availableQty < product.requestedQty) {
      return 'Disponibilidad insuficiente';
    }

    return 'Disponible';
  }
}
