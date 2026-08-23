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
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    error: 'border-rose-300 bg-rose-50 text-rose-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    info: 'border-sky-300 bg-sky-50 text-sky-900'
  };

  /** Clases resultantes segun el tono. */
  protected readonly classes = computed(
    () => 'rounded-lg border px-4 py-3 space-y-1 ' + AlertComponent.TONES[this.tone()]
  );
}
