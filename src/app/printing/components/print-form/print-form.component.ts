import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AlertComponent } from '../../../shared/ui/alert.component';
import { PrintRequestCreateDto, ZoneDto } from '../../models/printing.models';

/** Datos con los que el operario pide resolver una ETQ/LPN. */
export interface ResolveLabelRequest {
  lpn: string;
  zoneCode: string | null;
}

/**
 * Formulario de impresion: LPN, zona, usuario y motivo de reimpresion.
 *
 * El campo Usuario existe porque la seccion 9 del enunciado lo pide en pantalla, pero
 * es de solo lectura y se alimenta del JWT: si el operario pudiera escribirlo, la
 * auditoria dejaria de ser confiable, que es justo lo que se busca al registrarla.
 */
@Component({
  selector: 'app-print-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AlertComponent],
  templateUrl: './print-form.component.html'
})
export class PrintFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  /** Zonas disponibles para el selector. */
  readonly zones = input<ZoneDto[]>([]);

  /** Usuario autenticado, mostrado en solo lectura. */
  readonly userName = input('');

  /** Indica si la ETQ consultada ya fue impresa antes. */
  readonly requiresReprintReason = input(false);

  /**
   * Indica si el rol del usuario reimprime directamente.
   *
   * Cuando es falso la solicitud no se bloquea: se envia a autorizacion de un
   * supervisor, y lo unico que cambia es el aviso y el texto del boton.
   */
  readonly canReprint = input(false);

  /** Indica si hay una etiqueta resuelta lista para imprimir. */
  readonly hasLabel = input(false);

  /** Indica si hay una operacion en curso. */
  readonly busy = input(false);

  /** Solicita resolver la ETQ/LPN indicada. */
  readonly resolveLabel = output<ResolveLabelRequest>();

  /** Solicita procesar la impresion. */
  readonly submitPrint = output<PrintRequestCreateDto>();

  /** Formulario de la solicitud. */
  protected readonly form = this.formBuilder.nonNullable.group({
    lpn: ['', [Validators.required, Validators.maxLength(50)]],
    // Obligatoria aunque el API la acepte vacía. La zona decide contra qué stock se
    // valida, y es dato que solo tiene quien está en el piso: un valor por defecto la
    // convertiría en una suposición del sistema, y el operario recibiría un rechazo
    // correcto pero incomprensible por una zona que nunca eligió.
    zoneCode: ['', [Validators.required]],
    reprintReason: ['', [Validators.maxLength(300)]]
  });

  constructor() {
    // El motivo solo es obligatorio cuando la solicitud es realmente una reimpresion.
    // Exigirlo siempre convertiria un control de excepcion en friccion diaria.
    effect(() => {
      const control = this.form.controls.reprintReason;

      // El motivo se exige a todos, no solo a quien puede autorizar: para el operario
      // es lo unico que el supervisor tendra para decidir cuando abra la bandeja.
      const required = this.requiresReprintReason();

      control.setValidators(
        required
          ? [Validators.required, Validators.maxLength(300)]
          : [Validators.maxLength(300)]
      );
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Emite la consulta de la etiqueta.
   *
   * También exige la zona: el preview muestra disponibilidad por zona, y resolverlo sin
   * ella enseñaría el stock de una zona que el operario no eligió.
   */
  protected resolve(): void {
    const { lpn: lpnControl, zoneCode: zoneControl } = this.form.controls;

    if (lpnControl.invalid || zoneControl.invalid) {
      lpnControl.markAsTouched();
      zoneControl.markAsTouched();
      return;
    }

    const { lpn, zoneCode } = this.form.getRawValue();
    this.resolveLabel.emit({ lpn: lpn.trim(), zoneCode });
  }

  /** Emite la solicitud de impresion. */
  protected print(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { lpn, zoneCode, reprintReason } = this.form.getRawValue();

    this.submitPrint.emit({
      lpn: lpn.trim(),
      zoneCode,
      reprintReason: this.requiresReprintReason() ? reprintReason.trim() || null : null
    });
  }
}
