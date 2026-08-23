import { Injectable, computed, inject, signal } from '@angular/core';

import { ApiError, PagedMeta } from '../../shared/models/api-response.model';
import { PrintHistoryFilterDto, PrintHistoryItemDto } from '../models/printing.models';
import { PrintingService } from '../services/printing.service';

/** Filtros por defecto del historial. */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Estado del historial de impresiones.
 *
 * Se mantiene separado de `PrintingFacade` porque son dos flujos con ciclos de vida
 * distintos: el de impresion es transaccional y se limpia entre solicitudes, mientras
 * que el historial es una consulta con filtros que el usuario refina.
 */
@Injectable({ providedIn: 'root' })
export class HistoryFacade {
  private readonly printingService = inject(PrintingService);

  private readonly itemsSignal = signal<PrintHistoryItemDto[]>([]);
  private readonly metaSignal = signal<PagedMeta | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);
  private readonly loadedSignal = signal(false);

  private readonly filterSignal = signal<PrintHistoryFilterDto>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE
  });

  /** Registros de la pagina actual. */
  readonly items = this.itemsSignal.asReadonly();

  /** Metadatos de paginacion devueltos por el backend. */
  readonly meta = this.metaSignal.asReadonly();

  /** Indica si hay una consulta en curso. */
  readonly loading = this.loadingSignal.asReadonly();

  /** Error tecnico de la ultima consulta. */
  readonly error = this.errorSignal.asReadonly();

  /** Filtros aplicados actualmente. */
  readonly filter = this.filterSignal.asReadonly();

  /** Pagina actual, base 1. */
  readonly page = computed(() => this.metaSignal()?.page ?? this.filterSignal().page);

  /** Registros por pagina. */
  readonly pageSize = computed(() => this.metaSignal()?.pageSize ?? this.filterSignal().pageSize);

  /** Total de registros que cumplen el filtro. */
  readonly total = computed(() => this.metaSignal()?.total ?? 0);

  /** Paginas disponibles. */
  readonly totalPages = computed(() => this.metaSignal()?.totalPages ?? 0);

  /**
   * Alcance que el backend aplico a la consulta: OWN para operario, ALL para
   * supervisor y administrador. Se muestra en pantalla para que quede explicito
   * por que un operario ve menos filas de las que existen.
   */
  readonly scope = computed(() => this.metaSignal()?.scope ?? null);

  /** True cuando ya se ejecuto al menos una consulta: distingue "vacio" de "aun sin consultar". */
  readonly hasLoaded = this.loadedSignal.asReadonly();

  /** True cuando la consulta termino sin registros. */
  readonly isEmpty = computed(
    () => this.loadedSignal() && !this.loadingSignal() && this.itemsSignal().length === 0
  );

  /** Aplica filtros nuevos y vuelve a la primera pagina. */
  applyFilter(filter: Partial<PrintHistoryFilterDto>): void {
    // Cambiar un filtro y conservar la pagina mostraria una pagina vacia cuando el
    // nuevo resultado tiene menos paginas que el anterior.
    this.filterSignal.set({
      ...this.filterSignal(),
      ...filter,
      page: 1
    });

    this.load();
  }

  /** Navega a una pagina conservando los filtros aplicados. */
  goToPage(page: number): void {
    if (page < 1 || this.loadingSignal()) {
      return;
    }

    this.filterSignal.set({ ...this.filterSignal(), page });
    this.load();
  }

  /** Limpia los filtros y recarga desde la primera pagina. */
  clearFilters(): void {
    this.filterSignal.set({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    this.load();
  }

  /** Ejecuta la consulta con los filtros vigentes. */
  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.printingService.getHistory(this.filterSignal()).subscribe({
      next: (response) => {
        this.itemsSignal.set(response.data ?? []);
        this.metaSignal.set((response.meta as PagedMeta | null) ?? null);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      },
      error: (error: ApiError) => {
        // Se conserva la pagina anterior en pantalla: vaciar la tabla ante un fallo
        // de red le haria creer al usuario que sus registros desaparecieron.
        this.errorSignal.set(error);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      }
    });
  }
}
