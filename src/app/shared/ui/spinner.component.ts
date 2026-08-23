import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador de carga con etiqueta accesible. */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2 text-sm text-slate-600" role="status">
      <span
        class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
        aria-hidden="true"
      ></span>
      <span>{{ label() }}</span>
    </span>
  `
})
export class SpinnerComponent {
  /** Texto que acompana al indicador. */
  readonly label = input('Procesando...');
}
