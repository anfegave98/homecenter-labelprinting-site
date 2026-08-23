import { Injectable } from '@angular/core';

import { AuthUserDto } from '../models/auth.models';

const TOKEN_KEY = 'hc.etq.token';
const USER_KEY = 'hc.etq.user';
const EXPIRES_AT_KEY = 'hc.etq.expiresAt';

/**
 * Persiste la sesion entre recargas del navegador.
 *
 * Se usa `localStorage` y el token viaja por header `Authorization`, no por cookie:
 * el frontend (Cloudflare Pages) y el API (Render) viven en dominios distintos, y una
 * cookie cross-site exigiria `SameSite=None` con toda su carga de configuracion.
 *
 * El token guardado NO es una fuente de autoridad: el backend valida firma, vigencia y
 * rol en cada peticion. Lo que se guarda aqui solo evita pedir credenciales de nuevo.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  /** Guarda token, usuario y momento de expiracion calculado. */
  save(token: string, user: AuthUserDto, expiresInSeconds: number): void {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  }

  /** Retorna el token vigente, o null si no hay sesion o ya expiro. */
  getToken(): string | null {
    if (this.isExpired()) {
      this.clear();
      return null;
    }

    return localStorage.getItem(TOKEN_KEY);
  }

  /** Retorna el usuario de la sesion vigente. */
  getUser(): AuthUserDto | null {
    if (this.isExpired()) {
      this.clear();
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUserDto;
    } catch {
      // Un storage corrupto no debe dejar la aplicacion en un estado ambiguo.
      this.clear();
      return null;
    }
  }

  /** Elimina todo rastro de la sesion. */
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }

  private isExpired(): boolean {
    const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY));
    return !expiresAt || Date.now() >= expiresAt;
  }
}
