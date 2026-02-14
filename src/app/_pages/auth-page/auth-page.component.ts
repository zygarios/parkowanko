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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { extractFirstError } from '../../_others/_helpers/error-extractor';
import { validationMessages } from '../../_others/_helpers/validation-messages';
import { AuthService } from '../../_services/_core/auth.service';
import { GlobalSpinnerService } from '../../_services/_core/global-spinner.service';
import { SharedUtilsService } from '../../_services/_core/shared-utils.service';
import { SocialAuthButtonsComponent } from './_components/social-auth-buttons/social-auth-buttons.component';

import { AuthData, AuthModeType, modeToPathMap } from './auth-page.model';

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
    RouterLink,
    SocialAuthButtonsComponent,
  ],
  templateUrl: './auth-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  private _authService = inject(AuthService);
  private _globalSpinnerService = inject(GlobalSpinnerService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _sharedUtilsService = inject(SharedUtilsService);

  isPasswordHidden = signal(true);
  isRepeatedPasswordHidden = signal(true);
  authMode = signal<AuthModeType>(AuthModeType.LOGIN);
  authModeType = AuthModeType;
  resetPasswordToken = signal<string | null>(null);
  validationError = signal<string | null>(null);

  private authModel = signal<AuthData>({
    username: '',
    email: '',
    password: '',
    repeatedPassword: '',
  });

  constructor() {
    this._handleAuthModeFromUrl();
    this._handleResetPasswordToken();
  }

  private _handleAuthModeFromUrl() {
    this._route.params.subscribe((params) => {
      const segment = params['mode']?.toLowerCase();
      const mode = Array.from(modeToPathMap.entries()).find(([_, s]) => s === segment)?.[0];
      if (mode) {
        this.authMode.set(mode);
      } else {
        this._router.navigate([`/auth/${modeToPathMap.get(AuthModeType.LOGIN)}`]);
      }
    });
  }

  authForm = form(this.authModel, (path) => {
    required(path.username, { message: validationMessages.required });
    minLength(path.username, 3, { message: 'Minimalna długość znaków to 3' });
    hidden(path.username, () => this.authMode() !== AuthModeType.REGISTER);

    required(path.email, { message: validationMessages.required });
    email(path.email, { message: validationMessages.email });
    hidden(path.email, () => this.authMode() === AuthModeType.RESET_PASSWORD);

    required(path.password, { message: validationMessages.required });
    minLength(path.password, 8, { message: 'Minimalna długość znaków to 8' });
    hidden(path.password, () => this.authMode() === AuthModeType.FORGOT_PASSWORD);

    required(path.repeatedPassword, { message: validationMessages.required });

    hidden(
      path.repeatedPassword,
      () =>
        this.authMode() === AuthModeType.LOGIN || this.authMode() === AuthModeType.FORGOT_PASSWORD,
    );

    validate(path.repeatedPassword, ({ value, valueOf }) => {
      const confirmPassword = value();
      const password = valueOf(path.password);

      if (
        this.authMode() !== AuthModeType.REGISTER &&
        this.authMode() !== AuthModeType.RESET_PASSWORD
      )
        return null;

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

  changeAuthMode(mode: AuthModeType) {
    const segment = modeToPathMap.get(mode);
    if (segment) {
      this._router.navigate(['/auth', segment]);
    }
  }

  submit() {
    submit(this.authForm, async () => {
      const { username, email, password, repeatedPassword } = this.authModel();

      try {
        this._globalSpinnerService.show();

        if (this.authMode() === AuthModeType.LOGIN) {
          await firstValueFrom(this._authService.login({ email, password }));
        } else if (this.authMode() === AuthModeType.REGISTER) {
          await firstValueFrom(this._authService.register({ username, email, password }));
        } else if (this.authMode() === AuthModeType.FORGOT_PASSWORD) {
          await firstValueFrom(this._authService.requestPasswordReset(email));
          this.authMode.set(AuthModeType.EMAIL_SENT);
        } else if (this.authMode() === AuthModeType.RESET_PASSWORD) {
          const token = this.resetPasswordToken();
          if (!token) return;
          await firstValueFrom(
            this._authService.confirmPasswordReset({ token, password: repeatedPassword }),
          );
          this._sharedUtilsService.openSnackbar('Hasło zostało zmienione', 'SUCCESS');
          this._router.navigate([`/auth/${modeToPathMap.get(AuthModeType.LOGIN)}`]);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        this._globalSpinnerService.hide();
        return;
      }
    });
  }

  private _handleResetPasswordToken() {
    this._route.queryParams.subscribe(async (params) => {
      const token = params['token'];
      if (token && this.authMode() === AuthModeType.RESET_PASSWORD) {
        try {
          this._globalSpinnerService.show();
          await firstValueFrom(this._authService.validatePasswordResetToken(token));
          this.resetPasswordToken.set(token);
        } catch (err: any) {
          const errorMsg = extractFirstError(err.error);
          this.validationError.set(
            errorMsg || 'Link do resetowania hasła jest nieprawidłowy lub wygasł',
          );
          this.authMode.set(AuthModeType.TOKEN_ERROR);
        } finally {
          this._globalSpinnerService.hide();
        }
      }
    });
  }
}
