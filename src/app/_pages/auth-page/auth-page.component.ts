import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  email,
  form,
  FormField,
  hidden,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { validationMessages } from '../../_others/_helpers/validation-messages';
import { AuthService } from '../../_services/_core/auth.service';
import { GlobalSpinnerService } from '../../_services/_core/global-spinner.service';

interface AuthData {
  username: string;
  email: string;
  password: string;
  repeatedPassword: string;
}

enum AuthModeType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
}

@Component({
  selector: 'app-auth-page',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    FormField,
    NgOptimizedImage,
    FormField,
  ],
  templateUrl: './auth-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  private _authService = inject(AuthService);
  private _globalSpinnerService = inject(GlobalSpinnerService);

  isPasswordHidden = signal(true);
  isRepeatedPasswordHidden = signal(true);
  authMode = signal<AuthModeType>(AuthModeType.LOGIN);
  authModeType = AuthModeType;

  private authModel = signal<AuthData>({
    username: '',
    email: '',
    password: '',
    repeatedPassword: '',
  });

  authForm = form(this.authModel, (path) => {
    required(path.username, { message: validationMessages.required });
    minLength(path.username, 3, { message: 'Minimalna długość znaków to 3' });
    hidden(path.username, () => this.authMode() === AuthModeType.LOGIN);

    required(path.email, { message: validationMessages.required });
    email(path.email, { message: validationMessages.email });

    required(path.password, { message: validationMessages.required });
    minLength(path.password, 8, { message: 'Minimalna długość znaków to 8' });

    required(path.repeatedPassword, { message: validationMessages.required });

    hidden(path.repeatedPassword, () => this.authMode() === AuthModeType.LOGIN);

    validate(path.repeatedPassword, ({ value, valueOf }) => {
      const confirmPassword = value();
      const password = valueOf(path.password);
      if (confirmPassword !== password) {
        return {
          kind: 'passwordMismatch',
          message: 'Podane hasła nie są identyczne',
        };
      }
      return null;
    });
  });

  togglePasswordVisibility(field: 'password' | 'repeatedPassword') {
    if (field === 'password') this.isPasswordHidden.update((value) => !value);
    else this.isRepeatedPasswordHidden.update((value) => !value);
  }

  changeAuthMode() {
    this.authMode.update((value) =>
      value === AuthModeType.LOGIN ? AuthModeType.REGISTER : AuthModeType.LOGIN,
    );
  }

  submit() {
    submit(this.authForm, async () => {
      const { username, email, password } = this.authModel();

      const request$ =
        this.authMode() === AuthModeType.LOGIN
          ? this._authService.login({ email, password })
          : this._authService.register({ username, email, password });

      try {
        this._globalSpinnerService.show();
        await firstValueFrom(request$);
      } catch (err) {
        console.error(err);
      } finally {
        this._globalSpinnerService.hide();
        return;
      }
    });
  }
}
