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
    success: 'bg-hc-success-soft text-hc-success-strong',
    danger: 'bg-hc-danger-soft text-hc-danger-strong',
    warning: 'bg-hc-warn-soft text-hc-warn-strong',
    info: 'bg-hc-blue-soft text-hc-blue',
    neutral: 'bg-[#F3F3F3] text-hc-muted'
  };

  /** Clases resultantes segun el tono. */
  protected readonly classes = computed(
    () =>
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ' +
      BadgeComponent.TONES[this.tone()]
  );
}
