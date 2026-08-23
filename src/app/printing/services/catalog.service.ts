import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { ZoneDto } from '../models/printing.models';

/** Catalogos de referencia que alimentan los selectores de la UI. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  /** Obtiene las zonas logisticas disponibles. */
  getZones(): Observable<ZoneDto[]> {
    return this.http
      .get<ApiResponse<ZoneDto[]>>(`${environment.apiUrl}/zones`)
      .pipe(map((response) => response.data ?? []));
  }
}
