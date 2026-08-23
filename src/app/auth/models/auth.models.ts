/** Credenciales enviadas al endpoint de autenticacion. */
export interface LoginRequestDto {
  userName: string;
  password: string;
}

/** Usuario autenticado y los roles que porta el token. */
export interface AuthUserDto {
  id: number;
  userName: string;
  fullName: string;
  roles: string[];
}

/** Respuesta del login: token, vigencia y datos minimos de sesion. */
export interface LoginResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUserDto;
}

/** Roles reconocidos por el sistema. Deben coincidir con los del backend. */
export const RoleName = {
  Operario: 'Operario',
  Supervisor: 'Supervisor',
  Admin: 'Admin'
} as const;
