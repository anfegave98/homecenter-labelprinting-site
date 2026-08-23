import { Injectable, computed, inject, signal } from '@angular/core';

import { ApiError } from '../../shared/models/api-response.model';
import {
  LabelDetailDto,
  PrintRequestCreateDto,
  PrintResultDto,
  ZoneDto
} from '../models/printing.models';
import { CatalogService } from '../services/catalog.service';
import { PrintingService } from '../services/printing.service';

/**
 * Estado del flujo de impresion, expuesto como signals.
 *
 * Los componentes leen estado y disparan acciones; no conocen HTTP, envelopes ni
 * codigos de estado. Toda la traduccion de "que respondio el API" a "que ve el
 * operario" ocurre en un solo lugar.
 */
@Injectable({ providedIn: 'root' })
export class PrintingFacade {
  private readonly catalogService = inject(CatalogService);
  private readonly printingService = inject(PrintingService);

  private readonly zonesSignal = signal<ZoneDto[]>([]);
  private readonly labelSignal = signal<LabelDetailDto | null>(null);
  private readonly labelLoadingSignal = signal(false);
  private readonly labelErrorSignal = signal<ApiError | null>(null);
  private readonly resultSignal = signal<PrintResultDto | null>(null);
  private readonly rejectionSignal = signal<ApiError | null>(null);
  private readonly printingSignal = signal(false);

  /** Zonas disponibles para el selector. */
  readonly zones = this.zonesSignal.asReadonly();

  /** ETQ/LPN resuelta actualmente, o null si no se ha consultado. */
  readonly label = this.labelSignal.asReadonly();

  /** Indica si hay una consulta de etiqueta en curso. */
  readonly labelLoading = this.labelLoadingSignal.asReadonly();

  /** Error de la consulta de etiqueta (por ejemplo, LPN inexistente). */
  readonly labelError = this.labelErrorSignal.asReadonly();

  /** Resultado de la ultima solicitud procesada, aprobada o rechazada. */
  readonly result = this.resultSignal.asReadonly();

  /** Motivo del rechazo cuando la ultima solicitud no fue aprobada. */
  readonly rejection = this.rejectionSignal.asReadonly();

  /** Indica si hay una solicitud de impresion en curso. */
  readonly printing = this.printingSignal.asReadonly();

  /** Indica si la etiqueta consultada ya tenia una impresion aprobada previa. */
  readonly requiresReprintReason = computed(() => this.labelSignal()?.hasPreviousPrint === true);

  /** Carga las zonas una sola vez por sesion. */
  loadZones(): void {
    if (this.zonesSignal().length > 0) {
      return;
    }

    this.catalogService.getZones().subscribe({
      next: (zones) => this.zonesSignal.set(zones),
      error: (error: ApiError) => this.labelErrorSignal.set(error)
    });
  }

  /** Resuelve la ETQ/LPN para mostrar el preview antes de imprimir. */
  resolveLabel(lpn: string, zoneCode?: string | null): void {
    this.labelLoadingSignal.set(true);
    this.labelErrorSignal.set(null);
    this.labelSignal.set(null);
    this.clearResult();

    this.printingService.getLabel(lpn, zoneCode).subscribe({
      next: (label) => {
        this.labelSignal.set(label);
        this.labelLoadingSignal.set(false);
      },
      error: (error: ApiError) => {
        this.labelErrorSignal.set(error);
        this.labelLoadingSignal.set(false);
      }
    });
  }

  /**
   * Envia la solicitud de impresion.
   *
   * Distingue tres desenlaces: aprobada, rechazada por regla de negocio (HTTP 200 con
   * `success: false`) y fallo tecnico. Los dos ultimos se muestran distinto porque
   * significan cosas distintas: uno lo corrige el operario, el otro no.
   */
  print(dto: PrintRequestCreateDto): void {
    this.printingSignal.set(true);
    this.clearResult();

    this.printingService.print(dto).subscribe({
      next: (response) => {
        this.resultSignal.set(response.data);
        this.rejectionSignal.set(response.success ? null : response.error);
        this.printingSignal.set(false);

        // Tras una impresion aprobada la etiqueta queda marcada como ya impresa:
        // la siguiente solicitud sobre el mismo LPN es una reimpresion.
        if (response.success) {
          this.markLabelAsPrinted();
        }
      },
      error: (error: ApiError) => {
        this.rejectionSignal.set(error);
        this.printingSignal.set(false);
      }
    });
  }

  /** Limpia el resultado visible sin perder la etiqueta consultada. */
  clearResult(): void {
    this.resultSignal.set(null);
    this.rejectionSignal.set(null);
  }

  /** Limpia todo el estado del flujo. */
  reset(): void {
    this.labelSignal.set(null);
    this.labelErrorSignal.set(null);
    this.clearResult();
  }

  private markLabelAsPrinted(): void {
    const label = this.labelSignal();
    if (label && !label.hasPreviousPrint) {
      this.labelSignal.set({ ...label, hasPreviousPrint: true });
    }
  }
}
