import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vacio: comunica que no hay datos, no que algo fallo. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p class="font-medium text-slate-700">{{ title() }}</p>
      @if (description(); as text) {
        <p class="mt-1 text-sm text-slate-500">{{ text }}</p>
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
