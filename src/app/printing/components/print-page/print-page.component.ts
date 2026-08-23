import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';

import { AuthFacade } from '../../../auth/facades/auth.facade';
import { AlertComponent } from '../../../shared/ui/alert.component';
import { SpinnerComponent } from '../../../shared/ui/spinner.component';
import { PrintingFacade } from '../../facades/printing.facade';
import { PrintRequestCreateDto } from '../../models/printing.models';
import { LabelPreviewComponent } from '../label-preview/label-preview.component';
import { PrintFormComponent, ResolveLabelRequest } from '../print-form/print-form.component';
import { PrintResultComponent } from '../print-result/print-result.component';

/**
 * Pantalla de impresion: orquesta formulario, preview y resultado.
 *
 * El contenedor no contiene logica de negocio; solo conecta la fachada con los
 * componentes de presentacion, que reciben datos y emiten intenciones.
 */
@Component({
  selector: 'app-print-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PrintFormComponent,
    LabelPreviewComponent,
    PrintResultComponent,
    AlertComponent,
    SpinnerComponent
  ],
  templateUrl: './print-page.component.html'
})
export class PrintPageComponent implements OnInit {
  /** Estado del flujo de impresion. */
  protected readonly printing = inject(PrintingFacade);

  /** Estado de sesion. */
  protected readonly auth = inject(AuthFacade);

  /** Indica si hay alguna operacion en curso. */
  protected readonly busy = computed(
    () => this.printing.labelLoading() || this.printing.printing()
  );

  /** Carga el catalogo de zonas al entrar a la pantalla. */
  ngOnInit(): void {
    this.printing.loadZones();
  }

  /** Consulta la ETQ/LPN indicada en el formulario. */
  protected resolve(request: ResolveLabelRequest): void {
    this.printing.resolveLabel(request.lpn, request.zoneCode);
  }

  /** Envia la solicitud de impresion. */
  protected print(dto: PrintRequestCreateDto): void {
    this.printing.print(dto);
  }
}
