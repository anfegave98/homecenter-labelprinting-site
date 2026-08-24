import { saveBlobAs } from './file-download.util';
import { readLabelMetadata, renderLabelPng } from './label-preview.util';

/**
 * Entrega la etiqueta al operario: el `.zpl` que va a la impresora y un `.png` para ver.
 *
 * El ZPL es el artefacto real —es lo que una Zebra interpreta— pero es ilegible para una
 * persona, y durante la evaluación no hay impresora conectada. El PNG existe para que se
 * pueda comprobar de un vistazo que la etiqueta se genera con los datos correctos.
 *
 * El `.zpl` se guarda primero y siempre. Si el dibujo falla —un ZPL antiguo sin
 * metadatos, un canvas no disponible— el operario se queda igual con el archivo que
 * realmente necesita, en lugar de perder la descarga completa por la vista previa.
 */
export async function deliverLabel(blob: Blob, fileName: string): Promise<void> {
  saveBlobAs(blob, fileName);

  const zpl = await blob.text();
  const metadata = readLabelMetadata(zpl);

  if (!metadata) {
    return;
  }

  const png = await renderLabelPng(metadata);

  if (png) {
    saveBlobAs(png, fileName.replace(/\.zpl$/i, '.png'));
  }
}
