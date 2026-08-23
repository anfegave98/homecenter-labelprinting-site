/**
 * Configuracion de desarrollo local.
 * El API corre en Kestrel; el puerto debe coincidir con launchSettings.json del backend.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5080/api',

  /**
   * Cifrado del payload de credenciales. Apagado en local para poder depurar la
   * peticion de login legible. Ver la advertencia de alcance en shared/utils/crypto.util.ts:
   * esta capa complementa a HTTPS, no lo reemplaza.
   */
  encryptCredentials: false,

  /**
   * Llave AES-256 en Base64, compartida con Encryption:Key del backend.
   * NO es un secreto: viaja en el bundle. Se documenta asi a proposito.
   */
  encryptionKey: ''
};
