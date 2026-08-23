import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { LoginRequestDto, LoginResponseDto } from '../models/auth.models';

/** Transporte HTTP de la autenticacion. No guarda estado. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /**
   * Autentica al usuario contra el API.
   * Las credenciales invalidas llegan como HTTP 401 y las resuelve el interceptor
   * de errores; aqui solo se desenvuelve la respuesta exitosa.
   */
  login(dto: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http
      .post<ApiResponse<LoginResponseDto>>(`${environment.apiUrl}/auth/login`, dto)
      .pipe(map((response) => response.data as LoginResponseDto));
  }
}
