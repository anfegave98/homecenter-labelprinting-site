import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Tono visual del badge. */
export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

/** Etiqueta corta de estado: resultado, tipo de evento, estado de documento. */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      <ng-content />
    </span>
  `
})
export class BadgeComponent {
  /** Tono con el que se pinta el badge. */
  readonly tone = input<BadgeTone>('neutral');

  private static readonly TONES: Record<BadgeTone, string> = {
    success: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
    danger: 'bg-rose-100 text-rose-800 ring-rose-600/20',
    warning: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    info: 'bg-sky-100 text-sky-800 ring-sky-600/20',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20'
  };

  /** Clases resultantes segun el tono. */
  protected readonly classes = computed(
    () =>
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ' +
      BadgeComponent.TONES[this.tone()]
  );
}
