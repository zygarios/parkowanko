import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  email,
  Field,
  form,
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
import { validationMessages } from '../../_others/_helpers/validation-messages';

interface AuthData {
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
    Field,
    NgOptimizedImage,
  ],
  templateUrl: './auth-page.component.html',
  styles: `
    .auth-container {
      padding: var(--par-container-padding);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  isPasswordHidden = signal(true);
  isRepeatedPasswordHidden = signal(true);
  authMode = signal<AuthModeType>(AuthModeType.LOGIN);
  authModeType = AuthModeType;

  private authData = signal<AuthData>({ email: '', password: '', repeatedPassword: '' });

  authForm = form(this.authData, (path) => {
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
    submit(this.authForm, async (form) => {
      return null;
    });
  }
}
