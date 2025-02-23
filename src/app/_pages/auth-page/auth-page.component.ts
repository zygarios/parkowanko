import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

interface AuthFormData {
  email: string;
  password: string;
  repeatedPassword?: string;
}

type AuthFormSaveData = Omit<AuthFormData, 'repeatedPassword'>;

enum AuthMode {
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
  ],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  private _fb = inject(NonNullableFormBuilder);
  authMode = signal<AuthMode>(AuthMode.LOGIN);

  authForm = this._fb.group({
    email: this._fb.control('', [Validators.required]),
    password: this._fb.control('', [Validators.required]),
    repeatedPassword: this._fb.control('', [Validators.required]),
  });

  isPasswordHidden = signal(true);

  togglePasswordVisibility(event: MouseEvent) {
    event.stopPropagation();
    this.isPasswordHidden.update((value) => !value);
  }

  submit() {
    if (!this.authForm.valid) {
      return this.authForm.markAllAsTouched();
    } else {
      const formData = structuredClone(this.authForm.value);
      delete formData.repeatedPassword;
      const formSaveData = formData as AuthFormSaveData;
      console.log(formSaveData);
    }
  }
}
