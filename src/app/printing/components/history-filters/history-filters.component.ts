import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PrintHistoryFilterDto, ZoneDto } from '../../models/printing.models';

/** Filtros del historial de impresiones. */
@Component({
  selector: 'app-history-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './history-filters.component.html'
})
export class HistoryFiltersComponent {
  private readonly formBuilder = inject(FormBuilder);

  /** Zonas disponibles para el selector. */
  readonly zones = input<ZoneDto[]>([]);

  /**
   * True cuando el usuario puede consultar el historial de toda la tienda.
   * El filtro por usuario solo se ofrece a esos roles: mostrarselo a un operario
   * sugeriria que puede consultar a otros, cuando el backend se lo impide.
   */
  readonly canFilterByUser = input(false);

  /** Bloquea el formulario mientras hay una consulta en curso. */
  readonly disabled = input(false);

  /** Filtros solicitados por el usuario. */
  readonly search = output<Partial<PrintHistoryFilterDto>>();

  /** Solicitud de limpiar los filtros. */
  readonly clear = output<void>();

  /** Formulario de filtros. Todos los campos son opcionales. */
  protected readonly form = this.formBuilder.nonNullable.group({
    lpn: '',
    zoneCode: '',
    userName: '',
    result: '',
    eventType: '',
    dateFrom: '',
    dateTo: ''
  });

  /** Emite los filtros diligenciados, omitiendo los vacios. */
  protected submit(): void {
    const raw = this.form.getRawValue();

    this.search.emit({
      lpn: this.normalize(raw.lpn),
      zoneCode: this.normalize(raw.zoneCode),
      userName: this.canFilterByUser() ? this.normalize(raw.userName) : null,
      result: this.normalize(raw.result),
      eventType: this.normalize(raw.eventType),
      dateFrom: this.toIsoDate(raw.dateFrom),
      // El limite superior se lleva al final del dia: filtrar "hasta hoy" y no ver
      // lo impreso hoy seria un resultado incorrecto desde el punto de vista del usuario.
      dateTo: this.toIsoDate(raw.dateTo, true)
    });
  }

  /** Limpia el formulario y notifica al contenedor. */
  protected reset(): void {
    this.form.reset();
    this.clear.emit();
  }

  private normalize(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toIsoDate(value: string, endOfDay = false): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
}
