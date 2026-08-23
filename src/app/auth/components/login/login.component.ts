import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../shared/models/api-response.model';
import { AlertComponent } from '../../../shared/ui/alert.component';
import { SpinnerComponent } from '../../../shared/ui/spinner.component';
import { AuthFacade } from '../../facades/auth.facade';

/** Pantalla de ingreso al submodulo. */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AlertComponent, SpinnerComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Estado de sesion de la aplicacion. */
  protected readonly auth = inject(AuthFacade);

  /** Error del ultimo intento de autenticacion. */
  protected readonly error = signal<ApiError | null>(null);

  /** Indica si el usuario llego aqui porque su sesion expiro. */
  protected readonly sessionExpired = signal(
    this.route.snapshot.queryParamMap.get('expired') === 'true'
  );

  /** Formulario de credenciales. */
  protected readonly form = this.formBuilder.nonNullable.group({
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.maxLength(200)]]
  });

  /** Autentica al usuario y lo lleva a la vista de impresion. */
  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.sessionExpired.set(false);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/impresion';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: ApiError) => this.error.set(error)
    });
  }

  /** Rellena el formulario con un usuario de prueba documentado. */
  protected useDemoUser(userName: string, password: string): void {
    this.form.setValue({ userName, password });
  }
}
