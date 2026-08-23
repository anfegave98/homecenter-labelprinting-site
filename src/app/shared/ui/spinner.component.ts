import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador de carga con etiqueta accesible. */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2.5 text-sm font-bold text-hc-muted" role="status">
      <span
        class="h-4 w-4 animate-spin rounded-full border-2 border-hc-border border-t-hc-blue"
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
