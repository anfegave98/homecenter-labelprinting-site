import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Indicador de carga con la identidad de Homecenter.
 *
 * La animacion es la de `loading.scss` de la plantilla base, reproducida tal cual:
 * dos puntos que recorren el eje X mientras el delantero pasa de amarillo a azul y
 * escala al cruzarse. El unico ajuste es el amarillo, alineado al del logotipo
 * (#FBD600) para no arrastrar dos amarillos distintos en la misma pantalla.
 *
 * `@media (prefers-reduced-motion)` detiene el movimiento: una animacion en bucle
 * puede provocar molestias reales a quien es sensible al movimiento.
 */
@Component({
  selector: 'app-brand-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-5 text-center" role="status" aria-live="polite">
      <img
        src="/assets/brand/homecenter-isotipo.svg"
        alt=""
        aria-hidden="true"
        class="hc-breathe"
        [style.width.px]="markSize()"
      />

      <span class="hc-loader" aria-hidden="true"></span>

      <div class="flex flex-col gap-1.5">
        <p class="m-0 text-base font-black tracking-tight text-hc-ink">{{ label() }}</p>
        @if (detail(); as text) {
          <p class="m-0 text-[13px] leading-relaxed text-hc-faint text-pretty">{{ text }}</p>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .hc-loader {
      position: relative;
      width: 100px;
      height: 16px;
    }

    .hc-loader::before,
    .hc-loader::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fbd600;
      box-shadow: 32px 0 #fbd600;
      left: 0;
      top: 0;
      animation: hc-ball-move-x 2s linear infinite;
    }

    .hc-loader::after {
      box-shadow: none;
      transform: translateX(64px) scale(1);
      z-index: 2;
      animation: hc-loader-front 2s linear infinite;
    }

    @keyframes hc-loader-front {
      0%,
      5% {
        transform: translateX(64px) scale(1);
        background: #fbd600;
      }
      10% {
        transform: translateX(64px) scale(1);
        background: #0072ce;
      }
      40% {
        transform: translateX(32px) scale(1.5);
        background: #0072ce;
      }
      90%,
      95% {
        transform: translateX(0) scale(1);
        background: #0072ce;
      }
      100% {
        transform: translateX(0) scale(1);
        background: #fbd600;
      }
    }

    @keyframes hc-ball-move-x {
      0%,
      10% {
        transform: translateX(0);
      }
      90%,
      100% {
        transform: translateX(32px);
      }
    }

    .hc-breathe {
      animation: hc-breathe 2s ease-in-out infinite;
    }

    @keyframes hc-breathe {
      0%,
      100% {
        transform: translateY(0) scale(1);
      }
      50% {
        transform: translateY(-3px) scale(1.03);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hc-loader::before,
      .hc-loader::after,
      .hc-breathe {
        animation: none;
      }
      .hc-loader::after {
        background: #0072ce;
      }
    }
  `
})
export class BrandLoaderComponent {
  /** Mensaje principal mostrado bajo el indicador. */
  readonly label = input('Estamos obteniendo los datos de tu operación');

  /** Segunda linea opcional que precisa que se esta esperando. */
  readonly detail = input<string | null>(null);

  /** Ancho del isotipo en pixeles. */
  readonly markSize = input(74);
}
