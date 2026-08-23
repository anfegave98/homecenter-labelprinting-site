/**
 * Envelope uniforme de toda respuesta del API.
 *
 * El backend responde SIEMPRE con esta forma, incluso cuando rechaza por regla de
 * negocio: en ese caso llega HTTP 200 con `success: false`. Por eso el envelope se
 * modela explicitamente y no se desenvuelve a ciegas en los servicios.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: unknown | null;
}

/** Detalle del rechazo o error retornado por el API. */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown[] | null;
}

/** Metadatos de paginacion que acompanan al historial. */
export interface PagedMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  scope?: string;
}
