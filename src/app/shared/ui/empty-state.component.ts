import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vacio: comunica que no hay datos, no que algo fallo. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-dashed border-hc-border bg-white px-6 py-12 text-center">
      <p class="text-[15px] font-bold text-hc-ink">{{ title() }}</p>
      @if (description(); as text) {
        <p class="mt-1.5 text-sm text-hc-faint">{{ text }}</p>
      }
    </div>
  `
})
export class EmptyStateComponent {
  /** Titulo del estado vacio. */
  readonly title = input('Sin informacion');

  /** Descripcion opcional que orienta al usuario. */
  readonly description = input<string | null>(null);
}
