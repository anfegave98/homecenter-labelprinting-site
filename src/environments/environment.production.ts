/**
 * Configuracion de produccion.
 * El frontend se publica en Cloudflare Pages y consume el API desplegado en Render.
 * Este valor se resuelve en tiempo de build: debe fijarse ANTES de publicar en Cloudflare.
 */
export const environment = {
  production: true,
  apiUrl: 'https://homecenter-label-printing-api.onrender.com/api'
};
