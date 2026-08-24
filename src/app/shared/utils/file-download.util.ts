/**
 * Entrega un archivo recibido del API al sistema de archivos del usuario.
 *
 * La descarga no puede ser un enlace directo al endpoint: la etiqueta exige el token
 * JWT en la cabecera `Authorization`, y un `<a href>` del navegador no la envía. Por eso
 * el archivo se pide con `HttpClient`, llega como blob y se entrega desde memoria.
 *
 * El object URL se revoca siempre: cada uno retiene el blob completo en memoria hasta
 * que se libera, y en una jornada de piso de tienda son cientos de descargas sobre la
 * misma pestaña.
 */
export function saveBlobAs(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Extrae el nombre de archivo de la cabecera `Content-Disposition`.
 *
 * Se prefiere el nombre que decide el backend en lugar de recomponerlo en el cliente:
 * es el mismo que queda registrado en la auditoría.
 */
export function fileNameFromDisposition(header: string | null, fallback: string): string {
  if (!header) {
    return fallback;
  }

  // Se acepta tanto `filename="x.zpl"` como la forma extendida `filename*=UTF-8''x.zpl`,
  // que es la que usa ASP.NET cuando el nombre lleva caracteres no ASCII.
  const extended = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (extended) {
    return decodeURIComponent(extended[1].trim());
  }

  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
}
