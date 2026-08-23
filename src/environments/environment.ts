/**
 * Configuracion de desarrollo local.
 * El API corre en Kestrel; el puerto debe coincidir con launchSettings.json del backend.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5080/api'
};
