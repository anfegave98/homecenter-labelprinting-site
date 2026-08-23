import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { encryptPayload, isCryptoAvailable } from '../../shared/utils/crypto.util';
import { LoginRequestDto, LoginResponseDto } from '../models/auth.models';

/** Cuerpo alternativo con las credenciales cifradas. */
interface EncryptedLoginBody {
  encryptedPayload: string;
}

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
    return from(this.buildBody(dto)).pipe(
      switchMap((body) =>
        this.http.post<ApiResponse<LoginResponseDto>>(`${environment.apiUrl}/auth/login`, body)
      ),
      map((response) => response.data as LoginResponseDto)
    );
  }

  /**
   * Arma el cuerpo de la peticion, cifrando las credenciales si el ambiente lo pide.
   *
   * Si el cifrado esta configurado pero el navegador no expone Web Crypto (origen
   * inseguro), se envia en claro en lugar de dejar al usuario sin poder ingresar: la
   * alternativa seria un login roto sin explicacion, y la confidencialidad real la
   * aporta HTTPS de todas formas. El backend acepta ambas formas.
   */
  private async buildBody(dto: LoginRequestDto): Promise<LoginRequestDto | EncryptedLoginBody> {
    const shouldEncrypt =
      environment.encryptCredentials && environment.encryptionKey.length > 0 && isCryptoAvailable();

    if (!shouldEncrypt) {
      return dto;
    }

    return { encryptedPayload: await encryptPayload(dto, environment.encryptionKey) };
  }
}
