/**
 * Cifrado AES-256-CBC del payload sensible, interoperable con `AesEncryptionService`
 * del backend.
 *
 * ## Qué protege esto y qué no
 *
 * La confidencialidad en tránsito la aporta **HTTPS**, no esta utilidad. La llave
 * viaja dentro del bundle de JavaScript, así que cualquiera que abra las herramientas
 * de desarrollo puede leerla: frente a un atacante que ya intercepta el tráfico, esto
 * no agrega secreto.
 *
 * Lo que sí aporta es que las credenciales no queden en claro en registros
 * intermedios — historiales de proxy, trazas de red guardadas, capturas de sesión de
 * soporte — donde el cuerpo de la petición suele terminar copiado. Es una capa
 * adicional, no un reemplazo de TLS, y se documenta así a propósito para que nadie
 * la interprete como una garantía que no puede dar.
 *
 * Formato del mensaje: Base64( IV[16] || criptograma ), idéntico al del backend.
 */

/** Tamaño del vector de inicializacion de AES, en bytes. */
const IV_LENGTH = 16;

/**
 * Cifra un objeto y devuelve el mensaje en Base64.
 *
 * El IV es aleatorio en cada llamada y viaja como prefijo: reutilizarlo haría que dos
 * inicios de sesión del mismo usuario produjeran exactamente el mismo criptograma.
 */
export async function encryptPayload(payload: unknown, base64Key: string): Promise<string> {
  const key = await importKey(base64Key);
  const iv = crypto.getRandomValues(allocate(IV_LENGTH));

  const plainBytes = new TextEncoder().encode(JSON.stringify(payload));
  const cipherBytes = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, plainBytes);

  const message = allocate(IV_LENGTH + cipherBytes.byteLength);
  message.set(iv, 0);
  message.set(new Uint8Array(cipherBytes), IV_LENGTH);

  return toBase64(message);
}

/** Indica si el navegador expone Web Crypto sobre un origen seguro. */
export function isCryptoAvailable(): boolean {
  // `crypto.subtle` solo existe en contextos seguros (HTTPS o localhost). En un origen
  // inseguro es `undefined`, y llamarlo lanzaria un TypeError en medio del login.
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = fromBase64(base64Key);

  if (raw.length !== 32) {
    throw new Error(`La llave de cifrado debe decodificar a 32 bytes (AES-256); tiene ${raw.length}.`);
  }

  return crypto.subtle.importKey('raw', raw, { name: 'AES-CBC' }, false, ['encrypt']);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = allocate(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Reserva bytes sobre un `ArrayBuffer` concreto.
 *
 * TypeScript 5.7 parametrizo `Uint8Array` por su buffer, y `crypto.subtle` no acepta
 * el caso generico porque podria ser un `SharedArrayBuffer`. Anclar el tipo aqui evita
 * repartir aserciones por toda la utilidad.
 */
function allocate(length: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new ArrayBuffer(length));
}
