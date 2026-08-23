import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Tono del mensaje mostrado al usuario. */
export type AlertTone = 'success' | 'error' | 'warning' | 'info';

/** Mensaje destacado: confirmacion, rechazo de negocio o error tecnico. */
@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()" role="alert">
      @if (title(); as heading) {
        <p class="font-semibold">{{ heading }}</p>
      }
      <div class="text-sm"><ng-content /></div>
    </div>
  `
})
export class AlertComponent {
  /** Tono del mensaje. */
  readonly tone = input<AlertTone>('info');

  /** Titulo opcional del mensaje. */
  readonly title = input<string | null>(null);

  private static readonly TONES: Record<AlertTone, string> = {
    success: 'border-l-hc-success bg-hc-success-soft text-hc-success-strong',
    error: 'border-l-hc-danger bg-hc-danger-soft text-hc-danger-strong',
    warning: 'border-l-hc-warn bg-hc-warn-soft text-hc-warn-strong',
    info: 'border-l-hc-blue bg-hc-blue-soft text-hc-blue'
  };

  /** Clases resultantes segun el tono. */
  protected readonly classes = computed(
    () => 'rounded-[10px] border-l-4 px-4 py-3.5 space-y-1 ' + AlertComponent.TONES[this.tone()]
  );
}
