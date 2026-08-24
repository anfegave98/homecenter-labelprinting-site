import { InjectionToken } from '@angular/core';

/**
 * Estado que pertenece a una sesion y no debe sobrevivirla.
 *
 * Las fachadas de funcionalidad son singletons de raiz: viven mientras viva la
 * pestaña, no mientras viva la sesion. Sin un contrato como este, lo que un usuario
 * consulto queda en memoria y lo ve el siguiente que inicia sesion — una ETQ resuelta,
 * el resultado de una impresion o, peor, el historial completo de la tienda que un
 * supervisor consulto y que un operario no deberia ver.
 */
export interface SessionScopedState {
  /** Descarta todo lo que pertenecia a la sesion anterior. */
  resetForNewSession(): void;
}

/**
 * Fachadas que deben limpiarse al abrir o cerrar sesion.
 *
 * Se resuelve por token y no por dependencia directa para que la capa de
 * autenticacion no tenga que conocer las funcionalidades: `AuthFacade` sabe que
 * existe "estado de sesion" que limpiar, no que existe impresion ni historial.
 * Agregar una funcionalidad nueva es registrarla aqui, sin tocar autenticacion.
 */
export const SESSION_SCOPED_STATE = new InjectionToken<readonly SessionScopedState[]>(
  'SESSION_SCOPED_STATE'
);
