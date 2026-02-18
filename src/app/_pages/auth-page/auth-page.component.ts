import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom } from 'rxjs';
import { validationMessages } from '../../_others/_helpers/validation-messages';
import { AuthService } from '../../_services/_core/auth.service';
import { SharedUtilsService } from '../../_services/_core/shared-utils.service';
import { SocialLoginService } from '../../_services/_core/social-login.service';
import { AuthResponse } from '../../_types/auth/auth.model';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterPaths } from '../../_others/_helpers/router-paths';
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
    SocialAuthButtonsComponent,
  ],
  templateUrl: './auth-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  private _authService = inject(AuthService);
  private _dialog = inject(MatDialog);
  private _route = inject(ActivatedRoute);
  public router = inject(Router);
  private _sharedUtilsService = inject(SharedUtilsService);
  private _socialLoginService = inject(SocialLoginService);

  isPasswordHidden = signal(true);
  isRepeatedPasswordHidden = signal(true);
  authMode = signal<AuthModeType>(AuthModeType.LOGIN);
  authModeType = AuthModeType;
  resetPasswordToken = signal<string | null>(null);
  registeredEmail = signal<string | null>(null);

  showLoadingSpinner = computed(() => this.authMode() === AuthModeType.FINISH_REGISTER_GOOGLE);
  showTitle = computed(() => this.showForm());

  showForm = computed(() =>
    [
      AuthModeType.LOGIN,
      AuthModeType.REGISTER,
      AuthModeType.FORGOT_PASSWORD,
      AuthModeType.RESET_PASSWORD,
    ].includes(this.authMode()),
  );

  titleText = computed(() => {
    switch (this.authMode()) {
      case AuthModeType.LOGIN:
        return 'Logowanie';
      case AuthModeType.REGISTER:
        return 'Rejestracja';
      case AuthModeType.FORGOT_PASSWORD:
        return 'Przypomnienie hasła';
      case AuthModeType.RESET_PASSWORD:
        return 'Resetowanie hasła';
      default:
        return '';
    }
  });

  private authModel = signal<AuthData>({
    username: '',
    email: '',
    password: '',
    repeatedPassword: '',
  });

  constructor() {
    this._handleUrlData();
  }

  private _handleUrlData() {
    combineLatest([this._route.params, this._route.queryParams])
      .pipe(takeUntilDestroyed())
      .subscribe(async ([params, queryParams]) => {
        const { code, access, refresh, expiresIn, token } = queryParams as any;

        // 1. Obsługa zalogowania (Bezpośrednie tokeny z backendu lub wymiana kodu)
        if (access && refresh) {
          this._handleDirectTokenLogin(access, refresh, expiresIn);
          return;
        }

        if (code) {
          await this._handleCodeExchange(code);
          return;
        }

        // 2. Synchronizacja trybu autoryzacji z trasą
        this._syncAuthModeWithRoute(params['mode']);

        // 3. Obsługa tokenów specjalnych (Reset hasła / Potwierdzenie email)
        if (token) {
          await this._handleValidationToken(token);
        }
      });
  }

  /**
   * Obsługuje przypadek, gdy backend przekierowuje nas bezpośrednio z gotowymi tokenami JWT.
   */
  private _handleDirectTokenLogin(access: string, refresh: string, expiresIn?: string) {
    this.authMode.set(AuthModeType.FINISH_REGISTER_GOOGLE);
    const authRes: AuthResponse = {
      access,
      refresh,
      expiresIn: Number(expiresIn) || 3600,
      user: null as any, // TODO: Docelowo backend powinien wystawić endpoint do pobrania usera (/auth/me)
    };
    this._authService.handleAuthSuccess(authRes);
  }

  /**
   * Obsługuje przypadek FRONT-DRIVEN, gdzie dostajemy "code" i wymieniamy go calleem do API.
   */
  private async _handleCodeExchange(code: string) {
    this.authMode.set(AuthModeType.FINISH_REGISTER_GOOGLE);
    try {
      await firstValueFrom(this._socialLoginService.loginWithGoogle(code));
    } catch {
      this.changeAuthMode(AuthModeType.LOGIN);
    }
  }

  /**
   * Mapuje parametry trasy na odpowiedni AuthModeType.
   */
  private _syncAuthModeWithRoute(modeSegment?: string) {
    const segment = modeSegment?.toLowerCase();
    const mode = Array.from(modeToPathMap.entries()).find(
      ([_, path]) => path.endsWith(`/${segment}`) || path === segment,
    )?.[0];

    // Sprawdzenie czy jesteśmy na specyficznym pathu dla callbacku Google
    const isSocialCallback = window.location.pathname.endsWith(RouterPaths.FINISH_REGISTER_GOOGLE);

    if (mode) {
      this.authMode.set(mode);
    } else if (isSocialCallback) {
      this.authMode.set(AuthModeType.FINISH_REGISTER_GOOGLE);
    } else {
      this.router.navigate([RouterPaths.AUTH_LOGIN]);
    }
  }

  /**
   * Obsługuje tokeny weryfikacyjne dla resetu hasła i aktywacji konta.
   */
  private async _handleValidationToken(token: string) {
    const currentMode = this.authMode();

    if (currentMode === AuthModeType.RESET_PASSWORD) {
      try {
        await firstValueFrom(this._authService.validatePasswordResetToken(token));
        this.resetPasswordToken.set(token);
      } catch {
        this.changeAuthMode(AuthModeType.TOKEN_ERROR);
      }
    } else if (currentMode === AuthModeType.CONFIRM_EMAIL_AFTER_REGISTER) {
      try {
        await firstValueFrom(this._authService.confirmEmailAfterRegister(token));
        this._sharedUtilsService.openSnackbar('Konto zostało aktywowane!', 'SUCCESS');
      } catch {
        this.changeAuthMode(AuthModeType.TOKEN_ERROR);
      }
    }
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
    const fullPath = modeToPathMap.get(mode);
    if (fullPath) {
      this.router.navigate([fullPath]);
    } else {
      this.authMode.set(mode);
    }
  }

  async openPrivacyPolicy(): Promise<void> {
    const { PrivacyPolicyDialogComponent } =
      await import('../privacy-policy/privacy-policy-dialog.component');
    this._dialog.open(PrivacyPolicyDialogComponent, {
      maxWidth: '600px',
      width: '95vw',
      maxHeight: '80vh',
    });
  }

  submit() {
    submit(this.authForm, async () => {
      const mode = this.authMode();
      const { username, email, password, repeatedPassword } = this.authModel();
      const resetToken = this.resetPasswordToken();

      try {
        switch (mode) {
          case AuthModeType.LOGIN:
            await firstValueFrom(this._authService.login({ email, password }));
            break;

          case AuthModeType.REGISTER:
            await firstValueFrom(this._authService.register({ username, email, password }));
            this.registeredEmail.set(email);
            this.changeAuthMode(AuthModeType.REGISTER_EMAIL_SENT);
            break;

          case AuthModeType.FORGOT_PASSWORD:
            await firstValueFrom(this._authService.requestPasswordReset(email));
            this.changeAuthMode(AuthModeType.FORGOT_PASSWORD_EMAIL_SENT);
            break;

          case AuthModeType.RESET_PASSWORD:
            if (!resetToken) return;
            await firstValueFrom(
              this._authService.confirmPasswordReset({
                token: resetToken,
                password: repeatedPassword,
              }),
            );
            this._sharedUtilsService.openSnackbar('Hasło zostało zmienione', 'SUCCESS');
            this.router.navigate([RouterPaths.AUTH_LOGIN]);
            break;
        }
      } catch (err: any) {
        console.error(`Błąd podczas akcji ${mode}:`, err);
      }
    });
  }

  async resendConfirmationEmail() {
    const email = this.registeredEmail();
    if (!email) return;

    try {
      await firstValueFrom(this._authService.resendConfirmationEmail(email));
      this._sharedUtilsService.openSnackbar(
        'Email został wysłany ponownie. Sprawdź swoją skrzynkę.',
        'SUCCESS',
      );
    } catch (err: any) {
      console.error(err);
    }
  }
}
