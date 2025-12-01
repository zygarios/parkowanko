import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { email, Field, form, hidden, minLength, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

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
  ],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  protected isPasswordHidden = signal(true);
  protected isRepeatedPasswordHidden = signal(true);
  protected authMode = signal<AuthModeType>(AuthModeType.LOGIN);
  protected authModeType = AuthModeType;

  private authData = signal<AuthData>({ email: '', password: '', repeatedPassword: '' });

  protected authForm = form(this.authData, (path) => {
    required(path.email, { message: 'To pole jest wymagane' });
    email(path.email, { message: 'Nieprawidłowy format' });

    required(path.password, { message: 'To pole jest wymagane' });
    minLength(path.password, 8, { message: 'To pole jest wymagane' });

    required(path.repeatedPassword, { message: 'To pole jest wymagane' });
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

  protected togglePasswordVisibility(field: 'password' | 'repeatedPassword') {
    if (field === 'password') this.isPasswordHidden.update((value) => !value);
    else this.isRepeatedPasswordHidden.update((value) => !value);
  }

  protected changeAuthMode() {
    this.authMode.update((value) =>
      value === AuthModeType.LOGIN ? AuthModeType.REGISTER : AuthModeType.LOGIN,
    );
  }

  protected submit() {
    console.log(this.authForm().value());
  }
}
