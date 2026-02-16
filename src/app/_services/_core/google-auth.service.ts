import { inject, Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

declare var google: any;

/**
 * Service wrapping Google Identity Services (GIS) — Authorization Code Flow.
 *
 * Flow:
 * 1. `requestCode()` opens a Google popup
 * 2. User signs in and grants consent
 * 3. Google returns an authorization `code`
 * 4. Frontend sends `{ code }` to the backend
 * 5. Backend exchanges `code` for tokens via Google's token endpoint
 *    (requires `GOOGLE_CLIENT_SECRET` on the server)
 */
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private _ngZone = inject(NgZone);
  private _loadPromise: Promise<void> | null = null;

  /**
   * Opens the Google sign-in popup and returns the authorization code.
   * Loads the GIS SDK lazily on first call.
   */
  async requestCode(): Promise<string> {
    await this._ensureLoaded();

    return new Promise<string>((resolve, reject) => {
      const client = google.accounts.oauth2.initCodeClient({
        client_id: environment.googleClientId,
        scope: 'email profile openid',
        ux_mode: 'popup',
        callback: (response: any) => {
          this._ngZone.run(() => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else {
              resolve(response.code);
            }
          });
        },
        error_callback: (error: any) => {
          this._ngZone.run(() => {
            reject(new Error(error.message || error.type));
          });
        },
      });

      client.requestCode();
    });
  }

  private _ensureLoaded(): Promise<void> {
    if (!this._loadPromise) {
      this._loadPromise = this._loadScript();
    }
    return this._loadPromise;
  }

  private _loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already available (e.g. script was added elsewhere)
      if (typeof google !== 'undefined' && google.accounts?.oauth2) {
        resolve();
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);

      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google SDK')));
        return;
      }

      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this._loadPromise = null;
        reject(new Error('Failed to load Google SDK'));
      };
      document.head.appendChild(script);
    });
  }
}
