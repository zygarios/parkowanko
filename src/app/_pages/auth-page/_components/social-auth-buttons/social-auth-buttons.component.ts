import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GoogleAuthService } from '../../../../_services/_core/google-auth.service';

@Component({
  selector: 'app-social-auth-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 w-full">
      <!-- Google -->
      <button
        id="social-login-google"
        type="button"
        class="social-btn"
        [disabled]="isLoading()"
        (click)="loginWithGoogle()"
        aria-label="Zaloguj przez Google"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span class="hidden sm:inline">Google</span>
      </button>
    </div>
  `,
  styles: `
    .social-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
      min-height: 44px;
      border: 1px solid #dadce0;
      border-radius: 0.75rem;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      color: #3c4043;
    }

    .social-btn:hover:not(:disabled) {
      background: #f8fafc;
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.08);
    }

    .social-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .social-btn:focus-visible {
      outline: 2px solid var(--par-color-primary);
      outline-offset: 2px;
    }

    .social-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class SocialAuthButtonsComponent {
  private _googleAuth = inject(GoogleAuthService);

  isLoading = signal(false);

  async loginWithGoogle(): Promise<void> {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    try {
      await this._googleAuth.loginWithRedirect();
    } catch (err: unknown) {
      this.isLoading.set(false);
      if (err instanceof Error && !this._isUserCancellation(err)) {
        console.error('Google login error:', err);
      }
    }
  }

  private _isUserCancellation(err: Error): boolean {
    const msg = err.message.toLowerCase();
    return msg.includes('access_denied') || msg.includes('cancelled');
  }
}
