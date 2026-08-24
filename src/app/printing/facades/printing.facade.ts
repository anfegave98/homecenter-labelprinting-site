import { Injectable, computed, inject, signal } from '@angular/core';

import { ApiError } from '../../shared/models/api-response.model';
import { SessionScopedState } from '../../shared/state/session-scoped-state';
import { deliverLabel } from '../../shared/utils/label-delivery.util';
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
export class PrintingFacade implements SessionScopedState {
  private readonly catalogService = inject(CatalogService);
  private readonly printingService = inject(PrintingService);

  private readonly zonesSignal = signal<ZoneDto[]>([]);
  private readonly labelSignal = signal<LabelDetailDto | null>(null);
  private readonly labelLoadingSignal = signal(false);
  private readonly labelErrorSignal = signal<ApiError | null>(null);
  private readonly resultSignal = signal<PrintResultDto | null>(null);
  private readonly rejectionSignal = signal<ApiError | null>(null);
  private readonly printingSignal = signal(false);
  private readonly downloadingSignal = signal(false);
  private readonly downloadErrorSignal = signal<ApiError | null>(null);

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

  /** Indica si hay una descarga en curso. */
  readonly downloading = this.downloadingSignal.asReadonly();

  /** Motivo por el cual no se pudo entregar la etiqueta. */
  readonly downloadError = this.downloadErrorSignal.asReadonly();

  /**
   * Indica que hay una etiqueta aprobada esperando ser descargada.
   *
   * Mientras exista, la tarea del operario es bajarla, no pedir otra impresion.
   */
  readonly pendingDownload = computed(() => {
    const result = this.resultSignal();
    return result?.result === 'APPROVED' && result.requestId != null;
  });

  /**
   * Indica si la solicitud siguiente sobre esta etiqueta seria una reimpresion.
   *
   * Se calla mientras haya una descarga pendiente. Recien impresa, la etiqueta figura
   * como ya impresa —lo esta— y el aviso aparecia de inmediato, regañando al operario
   * por algo que acababa de hacer bien y cuya tarea siguiente era descargar el archivo.
   * La regla del backend no cambia: si de verdad vuelve a pedir la impresion, seguira
   * exigiendo motivo.
   */
  readonly requiresReprintReason = computed(
    () => this.labelSignal()?.hasPreviousPrint === true && !this.pendingDownload()
  );

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

  /**
   * Descarga la etiqueta de la solicitud recien aprobada.
   *
   * Al terminar se limpia la pantalla: la solicitud quedo cerrada y el formulario queda
   * listo para el siguiente LPN. Dejar el resultado en pantalla con el boton ya
   * deshabilitado solo invitaria a volver a pulsarlo.
   */
  downloadLabel(): void {
    const requestId = this.resultSignal()?.requestId;

    if (requestId == null || this.downloadingSignal()) {
      return;
    }

    this.downloadingSignal.set(true);
    this.downloadErrorSignal.set(null);

    this.printingService.downloadLabel(requestId).subscribe({
      next: (file) => {
        // El dibujo del PNG es asincrono; la pantalla se limpia cuando ambos archivos
        // ya salieron, no antes.
        void deliverLabel(file.blob, file.fileName).finally(() => {
          this.downloadingSignal.set(false);
          this.reset();
        });
      },
      error: (error: ApiError) => {
        this.downloadErrorSignal.set(error);
        this.downloadingSignal.set(false);
      }
    });
  }

  /** Limpia el resultado visible sin perder la etiqueta consultada. */
  clearResult(): void {
    this.resultSignal.set(null);
    this.rejectionSignal.set(null);
    this.downloadErrorSignal.set(null);
  }

  /** Limpia todo el estado del flujo. */
  reset(): void {
    this.labelSignal.set(null);
    this.labelErrorSignal.set(null);
    this.clearResult();
  }

  /**
   * Descarta el estado de la sesion anterior.
   *
   * Incluye el catalogo de zonas: aunque es comun a todos los usuarios, dejarlo
   * cargado haria que la pantalla se pintara con datos traidos con un token que ya
   * no vale. Volver a pedirlo cuesta una peticion y elimina la ambiguedad.
   */
  resetForNewSession(): void {
    this.zonesSignal.set([]);
    this.reset();
  }

  private markLabelAsPrinted(): void {
    const label = this.labelSignal();
    if (label && !label.hasPreviousPrint) {
      this.labelSignal.set({ ...label, hasPreviousPrint: true });
    }
  }
}
