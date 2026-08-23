import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import {
  LabelDetailDto,
  PrintHistoryFilterDto,
  PrintHistoryItemDto,
  PrintRequestCreateDto,
  PrintResultDto
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
