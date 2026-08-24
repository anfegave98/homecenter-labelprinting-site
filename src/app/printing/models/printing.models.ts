/**
 * Modelos del dominio de impresion.
 * Cada interfaz corresponde uno a uno con un DTO del backend; los nombres se mantienen
 * alineados a proposito para que un cambio de contrato sea visible de inmediato.
 */

/** Zona logistica de la tienda. */
export interface ZoneDto {
  id: number;
  code: string;
  name: string;
}

/** Documento origen de la etiqueta. */
export interface DocumentSummaryDto {
  documentType: string;
  documentNumber: string;
  status: string;
  requestId: string;
  requestedBy: string;
}

/** Producto asociado a la ETQ con su disponibilidad en la zona consultada. */
export interface ProductAvailabilityDto {
  productCode: string;
  productDescription: string;
  requestedQty: number;
  uom: string;
  availableQty: number;
  isStocked: boolean;
  isEligible: boolean;
}

/** Detalle resuelto de una ETQ/LPN. Es solo lectura: alimenta el preview. */
export interface LabelDetailDto {
  etqId: string;
  lpnId: string;
  isPreGenerated: boolean;
  templateCode: string;
  document: DocumentSummaryDto;
  zoneCode: string;
  products: ProductAvailabilityDto[];
  hasPreviousPrint: boolean;
  canPrint: boolean;
  blockingReason?: string | null;
}

/** Solicitud de impresion. El usuario no viaja en el body: se toma del JWT. */
export interface PrintRequestCreateDto {
  lpn: string;
  zoneCode?: string | null;
  reprintReason?: string | null;
}

/** Bloque compatible con el contrato legacy `responseEtq.json`. */
export interface LegacyEtqResponseDto {
  idEtiqueta: string;
  purchaseOrder: string;
  tcOrderId: string;
  sku: string;
  unidades: number;
  zpl: string;
  hasMultipleProducts: boolean;
}

/**
 * Resultado del procesamiento de la solicitud.
 *
 * Son tres desenlaces y no dos: una reimpresion pedida por alguien sin rol autorizado
 * no se rechaza, queda esperando la decision de un supervisor.
 */
export interface PrintResultDto {
  correlationId: string;
  /** Identificador en la auditoria. Es la llave con la que se aprueba o niega despues. */
  requestId?: number | null;
  result: 'APPROVED' | 'REJECTED' | 'PENDING_APPROVAL';
  eventType: 'PRINT' | 'REPRINT';
  etqId?: string | null;
  lpnId: string;
  zoneCode?: string | null;
  userName: string;
  documentNumber?: string | null;
  processedAt: string;
  reprintReason?: string | null;
  zpl?: string | null;
  products?: ProductAvailabilityDto[] | null;
  legacy?: LegacyEtqResponseDto | null;
  /** Supervisor o Admin que resolvio la reimpresion. Null mientras siga pendiente. */
  approvedBy?: string | null;
  decidedAt?: string | null;
  approvalNote?: string | null;
}

/** Decision de un autorizador sobre una reimpresion pendiente. */
export interface ReprintDecisionDto {
  /** Comentario del autorizador. Obligatorio al negar. */
  note?: string | null;
}

/** Detalle por producto que acompana un rechazo de inventario. */
export interface InventoryShortageDto {
  productCode: string;
  productDescription: string;
  requestedQty: number;
  availableQty: number;
  isStocked: boolean;
  reason: string;
}

/** Fila del historial de impresiones. */
export interface PrintHistoryItemDto {
  id: number;
  correlationId: string;
  etqId?: string | null;
  lpnId: string;
  zoneCode?: string | null;
  userName: string;
  documentNumber?: string | null;
  result: string;
  eventType: string;
  rejectionCode?: string | null;
  rejectionMessage?: string | null;
  reprintReason?: string | null;
  processedAt: string;
  approvedBy?: string | null;
  decidedAt?: string | null;
  approvalNote?: string | null;
  /** Momento en que se descargó la etiqueta. Null si sigue disponible. */
  downloadedAt?: string | null;
}

/** Archivo de etiqueta recibido del API, listo para entregar al usuario. */
export interface LabelFileDto {
  blob: Blob;
  fileName: string;
}

/** Filtros y paginacion del historial. */
export interface PrintHistoryFilterDto {
  lpn?: string | null;
  zoneCode?: string | null;
  userName?: string | null;
  result?: string | null;
  eventType?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  page: number;
  pageSize: number;
}
