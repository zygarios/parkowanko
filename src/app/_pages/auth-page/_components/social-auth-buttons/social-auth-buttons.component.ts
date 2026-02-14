import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  SocialAuthService,
} from '@abacritt/angularx-social-login';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SocialLoginService } from '../../../../_services/_core/social-login.service';

@Component({
  selector: 'app-social-auth-buttons',
  standalone: true,
  template: `
    <div class="mt-8 w-full">
      <div class="flex items-center w-full gap-4 mb-10">
        <div class="h-px bg-slate-200 flex-1"></div>
        <span class="text-slate-400 text-[12px] uppercase tracking-widest"
          >lub kontynuuj przez</span
        >
        <div class="h-px bg-slate-200 flex-1"></div>
      </div>

      <div class="flex items-center gap-3 w-full">
        <!-- Przycisk Google -->
        <div class="flex-1 overflow-hidden rounded-xl border border-[#dadce0]">
          <asl-google-signin-button
            type="standard"
            size="large"
            text="signin_with"
            shape="rectangular"
            [width]="250"
          />
        </div>

        <!-- Przycisk Facebook -->
        <button
          type="button"
          class="flex-1 group relative flex items-center justify-center gap-2 rounded-xl border border-[#dadce0] bg-white py-3 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] cursor-pointer shadow-sm"
          (click)="loginWithFacebook()"
          title="Zaloguj przez Facebook"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43L10.125 9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              fill="#1877F2"
            />
            <path
              d="M16.671 15.427l.532-3.47h-3.328V9.707c0-.949.465-1.874 1.956-1.874h1.516V4.88c0 0-1.374-.235-2.686-.235-2.741 0-4.533 1.662-4.533 4.669v2.653H7.078v3.47h3.047v8.385a12.09 12.09 0 001.997.165c.675 0 1.336-.056 1.984-.165v-8.385h2.796z"
              fill="white"
            />
          </svg>
          <span class="text-sm text-[#3c4043] font-medium hidden sm:inline">Facebook</span>
        </button>
      </div>
    </div>
  `,
  imports: [GoogleSigninButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialAuthButtonsComponent {
  private _socialAuthService = inject(SocialAuthService);
  private _socialLoginService = inject(SocialLoginService);

  constructor() {
    this._initSocialAuthListener();
  }

  private _initSocialAuthListener() {
    this._socialAuthService.authState.subscribe((user) => {
      if (user) {
        console.log(user);
        if (user.provider === GoogleLoginProvider.PROVIDER_ID) {
          this.handleGoogleLogin({
            access_token: user.authToken,
            id_token: user.idToken,
            code: user.authorizationCode,
          });
        } else if (user.provider === FacebookLoginProvider.PROVIDER_ID && user.authToken) {
          this.handleFacebookLogin(user.authToken);
        }
      }
    });
  }

  // loginWithGoogle() is no longer used for triggering signs-in
  // with Google Identity Services. The asl-google-signin-button handles it.

  async handleGoogleLogin(data: { access_token?: string; id_token?: string; code?: string }) {
    try {
      await firstValueFrom(this._socialLoginService.loginWithGoogle(data));
    } catch (err) {
      console.error('Google login error:', err);
    }
  }

  loginWithFacebook() {
    this._socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
  }

  async handleFacebookLogin(token: string) {
    try {
      await firstValueFrom(this._socialLoginService.loginWithFacebook(token));
    } catch (err) {
      console.error('Facebook login error:', err);
    }
  }
}
