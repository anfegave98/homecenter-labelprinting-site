/**
 * Configuracion de produccion.
 * El frontend se publica en Cloudflare Pages y consume el API desplegado en Render.
 * Este valor se resuelve en tiempo de build: debe fijarse ANTES de publicar en Cloudflare.
 */
export const environment = {
  production: true,
  apiUrl: 'https://homecenter-labelprinting-api.onrender.com/api',

  /**
   * Cifrado del payload de credenciales. Debe coincidir con Encryption:Enabled del
   * backend: si aqui esta encendido y alla apagado, el login responde 400.
   */
  encryptCredentials: false,

  /**
   * Llave AES-256 en Base64, la misma de Encryption:Key en Render.
   * NO es un secreto: se publica dentro del bundle de JavaScript. La confidencialidad
   * en transito la aporta HTTPS; esto solo evita que las credenciales queden en claro
   * en registros intermedios.
   */
  encryptionKey: ''
};
