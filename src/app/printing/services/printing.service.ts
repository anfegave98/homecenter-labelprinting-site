import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { fileNameFromDisposition } from '../../shared/utils/file-download.util';
import {
  LabelDetailDto,
  LabelFileDto,
  PrintHistoryFilterDto,
  PrintHistoryItemDto,
  PrintRequestCreateDto,
  PrintResultDto,
  ReprintDecisionDto
} from '../models/printing.models';

/** Transporte HTTP del flujo de impresion. */
@Injectable({ providedIn: 'root' })
export class PrintingService {
  private readonly http = inject(HttpClient);

  /** Resuelve una ETQ/LPN para alimentar el preview. No imprime ni audita. */
  getLabel(lpn: string, zoneCode?: string | null): Observable<LabelDetailDto> {
    let params = new HttpParams();
    if (zoneCode) {
      params = params.set('zoneCode', zoneCode);
    }

    return this.http
      .get<ApiResponse<LabelDetailDto>>(
        `${environment.apiUrl}/labels/${encodeURIComponent(lpn)}`,
        { params }
      )
      .pipe(map((response) => response.data as LabelDetailDto));
  }

  /**
   * Procesa la solicitud de impresion.
   *
   * Retorna el envelope completo y no solo `data` a proposito: un rechazo de regla
   * llega con HTTP 200 y `success: false`, y el motivo vive en `error`. Desenvolver
   * a `data` aqui borraria justamente la informacion que el operario necesita ver.
   */
  print(dto: PrintRequestCreateDto): Observable<ApiResponse<PrintResultDto>> {
    return this.http.post<ApiResponse<PrintResultDto>>(
      `${environment.apiUrl}/print-requests`,
      dto
    );
  }

  /**
   * Descarga la etiqueta de una solicitud aprobada.
   *
   * El endpoint responde de dos formas distintas: el archivo cuando procede y el
   * envelope cuando no. Se pide siempre como blob —no se puede saber cuál llegará antes
   * de recibirla— y si el tipo de contenido es JSON se lee el blob como texto para
   * recuperar el motivo y emitirlo como error.
   */
  downloadLabel(id: number): Observable<LabelFileDto> {
    return this.http
      .get(`${environment.apiUrl}/print-requests/${id}/label`, {
        observe: 'response',
        responseType: 'blob'
      })
      .pipe(
        switchMap((response) => {
          const body = response.body as Blob;

          if (body.type.includes('json')) {
            return this.rejectionFrom(body);
          }

          return [
            {
              blob: body,
              fileName: fileNameFromDisposition(
                response.headers.get('Content-Disposition'),
                `etiqueta-${id}.zpl`
              )
            }
          ];
        })
      );
  }

  /** Consulta la bandeja de reimpresiones pendientes de autorizacion. */
  getPending(page: number, pageSize: number): Observable<ApiResponse<PrintHistoryItemDto[]>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<ApiResponse<PrintHistoryItemDto[]>>(
      `${environment.apiUrl}/print-requests/pending`,
      { params }
    );
  }

  /**
   * Autoriza una reimpresion pendiente.
   *
   * Devuelve el envelope completo porque aprobar no garantiza imprimir: si el
   * inventario se agoto mientras la solicitud esperaba, la respuesta llega con
   * `success: false` y el motivo real en `error`.
   */
  approve(id: number, decision: ReprintDecisionDto): Observable<ApiResponse<PrintResultDto>> {
    return this.http.post<ApiResponse<PrintResultDto>>(
      `${environment.apiUrl}/print-requests/${id}/approve`,
      decision
    );
  }

  /** Niega una reimpresion pendiente. El motivo es obligatorio. */
  reject(id: number, decision: ReprintDecisionDto): Observable<ApiResponse<PrintResultDto>> {
    return this.http.post<ApiResponse<PrintResultDto>>(
      `${environment.apiUrl}/print-requests/${id}/reject`,
      decision
    );
  }

  /** Traduce un envelope recibido como blob al error que espera el consumidor. */
  private rejectionFrom(body: Blob): Observable<never> {
    return new Observable<string>((subscriber) => {
      body
        .text()
        .then((text) => {
          subscriber.next(text);
          subscriber.complete();
        })
        .catch((error: unknown) => subscriber.error(error));
    }).pipe(
      switchMap((text) => {
        const envelope = JSON.parse(text) as ApiResponse<unknown>;

        return throwError(
          () =>
            envelope.error ?? {
              code: 'UNKNOWN',
              message: 'No fue posible descargar la etiqueta.'
            }
        );
      })
    );
  }

  /** Consulta el historial. El alcance por rol lo impone el backend. */
  getHistory(filter: PrintHistoryFilterDto): Observable<ApiResponse<PrintHistoryItemDto[]>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);

    const optional: (keyof PrintHistoryFilterDto)[] = [
      'lpn',
      'zoneCode',
      'userName',
      'result',
      'eventType',
      'dateFrom',
      'dateTo'
    ];

    for (const key of optional) {
      const value = filter[key];
      if (value) {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<ApiResponse<PrintHistoryItemDto[]>>(
      `${environment.apiUrl}/print-requests/history`,
      { params }
    );
  }
}
