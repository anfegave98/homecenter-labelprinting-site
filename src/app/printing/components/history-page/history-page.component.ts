import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';

import { AuthFacade } from '../../../auth/facades/auth.facade';
import { AlertComponent } from '../../../shared/ui/alert.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PaginationComponent } from '../../../shared/ui/pagination.component';
import { BrandLoaderComponent } from '../../../shared/ui/brand-loader.component';
import { HistoryFacade } from '../../facades/history.facade';
import { PrintingFacade } from '../../facades/printing.facade';
import { PrintHistoryFilterDto } from '../../models/printing.models';
import { HistoryFiltersComponent } from '../history-filters/history-filters.component';
import { HistoryTableComponent } from '../history-table/history-table.component';

/**
 * Pantalla de historial: filtros, listado y paginacion.
 *
 * El contenedor conecta las fachadas con los componentes de presentacion; el alcance
 * de lo que se ve lo decide el backend segun el rol, no esta pantalla.
 */
@Component({
  selector: 'app-history-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HistoryFiltersComponent,
    HistoryTableComponent,
    PaginationComponent,
    AlertComponent,
    EmptyStateComponent,
    BrandLoaderComponent
  ],
  templateUrl: './history-page.component.html'
})
export class HistoryPageComponent implements OnInit {
  /** Estado del historial. */
  protected readonly history = inject(HistoryFacade);

  /** Catalogo de zonas, compartido con la pantalla de impresion. */
  protected readonly printing = inject(PrintingFacade);

  /** Estado de sesion. */
  protected readonly auth = inject(AuthFacade);

  /**
   * Mensaje del alcance aplicado. Se muestra siempre que el backend lo informe:
   * un operario que ve tres filas debe saber que son las suyas y no las de la tienda.
   */
  protected readonly scopeLabel = computed(() => {
    const scope = this.history.scope();
    if (scope === 'OWN') {
      return 'Estás viendo únicamente tus propias solicitudes.';
    }
    if (scope === 'ALL') {
      return 'Estás viendo las solicitudes de toda la tienda.';
    }
    return null;
  });

  /** Carga zonas e historial al entrar a la pantalla. */
  ngOnInit(): void {
    this.printing.loadZones();
    this.history.load();
  }

  /** Aplica los filtros diligenciados. */
  protected search(filter: Partial<PrintHistoryFilterDto>): void {
    this.history.applyFilter(filter);
  }

  /** Limpia los filtros aplicados. */
  protected clear(): void {
    this.history.clearFilters();
  }

  /** Cambia de pagina conservando los filtros. */
  protected goToPage(page: number): void {
    this.history.goToPage(page);
  }
}
