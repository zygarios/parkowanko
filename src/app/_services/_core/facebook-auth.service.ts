import { inject, Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';

const FB_SDK_SRC = 'https://connect.facebook.net/pl_PL/sdk.js';

declare var FB: any;

/**
 * Service wrapping the Facebook Login SDK.
 *
 * Flow:
 * 1. `login()` opens the Facebook login popup
 * 2. User signs in and grants permissions
 * 3. Facebook returns an `access_token`
 * 4. Frontend sends `{ access_token }` to the backend
 * 5. Backend verifies the token via Facebook Graph API
 *    and fetches user info (`/me?fields=id,name,email`)
 */
@Injectable({ providedIn: 'root' })
export class FacebookAuthService {
  private _ngZone = inject(NgZone);
  private _loadPromise: Promise<void> | null = null;

  /**
   * Opens the Facebook login popup and returns the access token.
   * Loads the FB SDK lazily on first call.
   */
  async login(): Promise<string> {
    if (!environment.facebookAppId) {
      throw new Error('Facebook App ID is not configured.');
    }

    await this._ensureLoaded();

    if (typeof FB === 'undefined') {
      throw new Error('Facebook SDK failed to load.');
    }

    return new Promise<string>((resolve, reject) => {
      // FB.login can fail silently on HTTP, so we add a timeout
      // to ensure we don't hang indefinitely.
      const timeout = setTimeout(() => {
        reject(new Error('Facebook login timeout. Ensure you are using HTTPS.'));
      }, 30000); // 30s timeout

      try {
        FB.login(
          (response: any) => {
            clearTimeout(timeout);
            this._ngZone.run(() => {
              if (response.authResponse?.accessToken) {
                resolve(response.authResponse.accessToken);
              } else {
                reject(new Error('Facebook login cancelled or failed.'));
              }
            });
          },
          { scope: 'email,public_profile' },
        );
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  private _ensureLoaded(): Promise<void> {
    if (!this._loadPromise) {
      this._loadPromise = this._loadSdk();
    }
    return this._loadPromise;
  }

  private _loadSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof FB !== 'undefined') {
        resolve();
        return;
      }

      (window as any).fbAsyncInit = () => {
        if (!environment.facebookAppId) {
          console.error(
            'Facebook App ID is not configured. Update src/environments/environment.ts',
          );
          reject(new Error('Facebook App ID not configured'));
          return;
        }

        FB.init({
          appId: environment.facebookAppId,
          cookie: true,
          xfbml: false,
          version: 'v21.0',
        });
        resolve();
      };

      const script = document.createElement('script');
      script.src = FB_SDK_SRC;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        this._loadPromise = null;
        reject(new Error('Failed to load Facebook SDK'));
      };
      document.head.appendChild(script);
    });
  }
}
