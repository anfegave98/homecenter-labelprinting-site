import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Control de paginacion sobre metadatos del backend. */
@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3"
      aria-label="Paginación del historial"
    >
      <p class="text-sm text-slate-600">
        {{ rangeLabel() }}
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition
                 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="disabled() || page() <= 1"
          (click)="pageChange.emit(page() - 1)"
        >
          Anterior
        </button>

        <span class="text-sm text-slate-600" aria-live="polite">
          Página {{ page() }} de {{ totalPages() || 1 }}
        </span>

        <button
          type="button"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition
                 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="disabled() || page() >= totalPages()"
          (click)="pageChange.emit(page() + 1)"
        >
          Siguiente
        </button>
      </div>
    </nav>
  `
})
export class PaginationComponent {
  /** Pagina actual, base 1. */
  readonly page = input.required<number>();

  /** Registros por pagina. */
  readonly pageSize = input.required<number>();

  /** Total de registros que cumplen el filtro. */
  readonly total = input.required<number>();

  /** Paginas disponibles segun el filtro aplicado. */
  readonly totalPages = input.required<number>();

  /** Bloquea los controles mientras hay una consulta en curso. */
  readonly disabled = input(false);

  /** Pagina solicitada por el usuario. */
  readonly pageChange = output<number>();

  /**
   * Se muestra el rango real y no solo el numero de pagina: en una auditoria importa
   * saber cuantos registros existen, no solo cuantos caben en la pantalla.
   */
  protected readonly rangeLabel = computed(() => {
    const total = this.total();
    if (total === 0) {
      return 'Sin registros';
    }

    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(this.page() * this.pageSize(), total);

    return `${from}–${to} de ${total} registro(s)`;
  });
}
