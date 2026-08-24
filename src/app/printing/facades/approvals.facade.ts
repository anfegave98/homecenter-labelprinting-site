import { Injectable, computed, inject, signal } from '@angular/core';

import { ApiError, PagedMeta } from '../../shared/models/api-response.model';
import { SessionScopedState } from '../../shared/state/session-scoped-state';
import { PrintHistoryItemDto, PrintResultDto } from '../models/printing.models';
import { PrintingService } from '../services/printing.service';

/** Registros por pagina de la bandeja. */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Bandeja de reimpresiones pendientes de autorizacion.
 *
 * Se mantiene aparte de `HistoryFacade` aunque ambas listen filas de auditoria: el
 * historial es una consulta que el usuario refina, mientras que esta es una cola de
 * trabajo que se vacia. Mezclarlas obligaria a que el historial supiera de decisiones
 * y de recargas tras aprobar.
 */
@Injectable({ providedIn: 'root' })
export class ApprovalsFacade implements SessionScopedState {
  private readonly printingService = inject(PrintingService);

  private readonly itemsSignal = signal<PrintHistoryItemDto[]>([]);
  private readonly metaSignal = signal<PagedMeta | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly loadedSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);
  private readonly pageSignal = signal(1);

  private readonly decidingSignal = signal<number | null>(null);
  private readonly outcomeSignal = signal<PrintResultDto | null>(null);
  private readonly outcomeErrorSignal = signal<ApiError | null>(null);

  /** Solicitudes pendientes de la pagina actual. */
  readonly items = this.itemsSignal.asReadonly();

  /** Indica si hay una consulta en curso. */
  readonly loading = this.loadingSignal.asReadonly();

  /** True cuando ya se consulto al menos una vez: distingue vacio de aun sin consultar. */
  readonly hasLoaded = this.loadedSignal.asReadonly();

  /** Error tecnico de la ultima consulta. */
  readonly error = this.errorSignal.asReadonly();

  /** Identificador de la solicitud que se esta resolviendo, si hay alguna. */
  readonly deciding = this.decidingSignal.asReadonly();

  /** Resultado de la ultima decision tomada. */
  readonly outcome = this.outcomeSignal.asReadonly();

  /** Motivo por el cual la ultima decision no termino en impresion. */
  readonly outcomeError = this.outcomeErrorSignal.asReadonly();

  /** Total de solicitudes pendientes. */
  readonly total = computed(() => this.metaSignal()?.total ?? 0);

  /** Pagina actual, base 1. */
  readonly page = computed(() => this.metaSignal()?.page ?? this.pageSignal());

  /** Registros por pagina. */
  readonly pageSize = computed(() => this.metaSignal()?.pageSize ?? DEFAULT_PAGE_SIZE);

  /** Paginas disponibles. */
  readonly totalPages = computed(() => this.metaSignal()?.totalPages ?? 0);

  /** True cuando no hay nada por atender. */
  readonly isEmpty = computed(
    () => this.loadedSignal() && !this.loadingSignal() && this.itemsSignal().length === 0
  );

  /** Consulta la bandeja. */
  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.printingService.getPending(this.pageSignal(), DEFAULT_PAGE_SIZE).subscribe({
      next: (response) => {
        this.itemsSignal.set(response.data ?? []);
        this.metaSignal.set((response.meta as PagedMeta | null) ?? null);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      },
      error: (error: ApiError) => {
        this.errorSignal.set(error);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      }
    });
  }

  /** Navega a una pagina de la bandeja. */
  goToPage(page: number): void {
    if (page < 1 || this.loadingSignal()) {
      return;
    }

    this.pageSignal.set(page);
    this.load();
  }

  /** Autoriza una solicitud pendiente. */
  approve(id: number, note: string | null): void {
    this.decide(id, () => this.printingService.approve(id, { note }));
  }

  /** Niega una solicitud pendiente. */
  reject(id: number, note: string): void {
    this.decide(id, () => this.printingService.reject(id, { note }));
  }

  /** Descarta el aviso de la ultima decision. */
  clearOutcome(): void {
    this.outcomeSignal.set(null);
    this.outcomeErrorSignal.set(null);
  }

  /**
   * Descarta el estado de la sesion anterior.
   *
   * La bandeja solo la ve un rol autorizado: dejarla en memoria haria que un operario
   * que inicie sesion despues alcance a ver la cola de su supervisor.
   */
  resetForNewSession(): void {
    this.itemsSignal.set([]);
    this.metaSignal.set(null);
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
    this.loadedSignal.set(false);
    this.pageSignal.set(1);
    this.decidingSignal.set(null);
    this.clearOutcome();
  }

  /**
   * Ejecuta una decision y recarga la bandeja.
   *
   * La recarga es incondicional, tambien cuando la respuesta llega con `success:false`:
   * aprobar puede terminar en rechazo si las reglas dejaron de cumplirse, y en ambos
   * casos la solicitud sale de la cola. Dejarla en pantalla invitaria a decidirla otra
   * vez sobre algo ya cerrado.
   */
  private decide(id: number, action: () => ReturnType<PrintingService['approve']>): void {
    this.decidingSignal.set(id);
    this.clearOutcome();

    action().subscribe({
      next: (response) => {
        this.outcomeSignal.set(response.data);
        this.outcomeErrorSignal.set(response.success ? null : response.error);
        this.decidingSignal.set(null);
        this.load();
      },
      error: (error: ApiError) => {
        this.outcomeErrorSignal.set(error);
        this.decidingSignal.set(null);
      }
    });
  }
}
