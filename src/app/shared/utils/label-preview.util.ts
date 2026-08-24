/**
 * Dibuja una vista previa de la etiqueta a partir del propio archivo ZPL.
 *
 * No es un intérprete de ZPL: no lo sería sin implementar el formato completo, y eso
 * está muy fuera de alcance. Los datos se leen del bloque de metadatos que el ZPL trae
 * embebido como comentario `^FX`, escrito por el mismo proceso que compuso la etiqueta.
 *
 * Esa decisión es deliberada. Dibujar la imagen con datos traídos por otra vía dejaría
 * el `.png` y el `.zpl` de la misma descarga contando historias distintas si alguna de
 * las dos cambiara. Al salir ambos del mismo archivo, no pueden divergir.
 */

/** Marca del bloque de metadatos dentro del ZPL. Debe coincidir con el backend. */
const METADATA_PREFIX = 'HC-META:';

/** Proporción 4x6 pulgadas a 203 ppp, que es la plantilla declarada por la ETQ. */
const WIDTH = 812;
const HEIGHT = 1218;

/** Producto tal como viaja en los metadatos de la etiqueta. */
interface LabelProduct {
  productCode: string;
  productDescription: string;
  requestedQty: number;
  uom: string;
}

/** Datos que el ZPL lleva embebidos para poder dibujarse. */
export interface LabelMetadata {
  etqId: string;
  lpnId: string;
  templateCode: string;
  zoneCode: string;
  documentNumber: string;
  documentType: string;
  requestId: string;
  requestedBy: string;
  products: LabelProduct[];
}

/**
 * Extrae los metadatos embebidos en el ZPL.
 * Devuelve null si el archivo no los trae: una etiqueta antigua sigue descargándose como
 * `.zpl` aunque no se pueda dibujar.
 */
export function readLabelMetadata(zpl: string): LabelMetadata | null {
  const start = zpl.indexOf(METADATA_PREFIX);
  if (start < 0) {
    return null;
  }

  const from = start + METADATA_PREFIX.length;
  const end = zpl.indexOf('^FS', from);
  if (end < 0) {
    return null;
  }

  try {
    return JSON.parse(zpl.slice(from, end)) as LabelMetadata;
  } catch {
    // Un ZPL manipulado no debe tumbar la descarga del archivo, que es lo que el
    // operario realmente necesita.
    return null;
  }
}

/** Dibuja la etiqueta y la devuelve como PNG. */
export function renderLabelPng(metadata: LabelMetadata): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.resolve(null);
  }

  paint(ctx, metadata);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

function paint(ctx: CanvasRenderingContext2D, label: LabelMetadata): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  // Encabezado
  ctx.font = '700 62px Lato, Arial, sans-serif';
  ctx.fillText('HOMECENTER', 40, 40);

  ctx.font = '400 26px Lato, Arial, sans-serif';
  ctx.fillText('Etiqueta de unidad logística', 40, 118);

  rule(ctx, 168, 4);

  // Identificación. El ancho disponible se acota por columna: un código de zona largo
  // se salía del borde derecho de la etiqueta.
  field(ctx, 'ETQ', label.etqId, 40, 198, 360);
  field(ctx, 'ZONA', label.zoneCode, 420, 198, WIDTH - 460);

  ctx.font = '400 24px Lato, Arial, sans-serif';
  ctx.fillText('DOCUMENTO', 40, 316);
  ctx.font = '700 36px Lato, Arial, sans-serif';
  ctx.fillText(`${label.documentNumber} · ${label.documentType}`, 40, 350);

  rule(ctx, 412, 3);

  drawBarcode(ctx, label.lpnId, 40, 448, WIDTH - 80, 140);

  ctx.font = '400 26px Lato, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label.lpnId, WIDTH / 2, 600);
  ctx.textAlign = 'left';

  // Productos
  ctx.font = '700 28px Lato, Arial, sans-serif';
  ctx.fillText(`PRODUCTOS (${label.products.length})`, 40, 650);
  rule(ctx, 692, 3);

  ctx.font = '400 26px Lato, Arial, sans-serif';
  let line = 712;

  for (const product of label.products) {
    ctx.fillText(`${product.productCode}  ${product.productDescription}`, 40, line);

    ctx.textAlign = 'right';
    ctx.fillText(`${product.requestedQty} ${product.uom}`, WIDTH - 40, line);
    ctx.textAlign = 'left';

    line += 40;
  }

  // Pie
  rule(ctx, 1086, 3);
  ctx.font = '400 22px Lato, Arial, sans-serif';
  ctx.fillText(`LPN ${label.lpnId}`, 40, 1106);
  ctx.fillText(`Plantilla ${label.templateCode}`, 40, 1146);
  ctx.fillText('Solicitado por', 520, 1106);
  ctx.fillText(label.requestedBy, 520, 1146);
}

function rule(ctx: CanvasRenderingContext2D, y: number, height: number): void {
  ctx.fillRect(40, y, WIDTH - 80, height);
}

function field(
  ctx: CanvasRenderingContext2D,
  caption: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number
): void {
  ctx.font = '400 24px Lato, Arial, sans-serif';
  ctx.fillText(caption, x, y);

  fitText(ctx, value, x, y + 32, maxWidth, 48);
}

/**
 * Escribe el texto reduciendo el tamaño hasta que quepa en el ancho dado.
 *
 * Los códigos de zona y de ETQ no tienen longitud acotada, y uno largo se salía del
 * borde de la etiqueta. Encoger es preferible a recortar: un identificador cortado es
 * peor que uno pequeño, porque parece otro identificador.
 */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startSize: number
): void {
  let size = startSize;

  do {
    ctx.font = `700 ${size}px Lato, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    size -= 2;
  } while (size > 16);

  ctx.fillText(text, x, y);
}

/**
 * Dibuja una representación de código de barras a partir del texto.
 *
 * Las barras se derivan de los caracteres del LPN, así que dos LPN distintos producen
 * patrones distintos, pero **no es Code 128 real y no se puede leer con pistola**. La
 * lectura de verdad la da el `.zpl`, que sí lleva el `^BC` que la impresora interpreta.
 * Esto es una vista previa; implementar la codificación completa sería reescribir en el
 * cliente lo que la impresora ya hace.
 */
function drawBarcode(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const unit = 3;
  let cursor = x;

  ctx.fillStyle = '#000000';

  for (let index = 0; cursor < x + width - unit * 4; index += 1) {
    const code = value.charCodeAt(index % value.length) + index;
    const barWidth = ((code % 3) + 1) * unit;
    const gap = ((code % 2) + 1) * unit;

    if (cursor + barWidth > x + width) {
      break;
    }

    ctx.fillRect(cursor, y, barWidth, height);
    cursor += barWidth + gap;
  }
}
