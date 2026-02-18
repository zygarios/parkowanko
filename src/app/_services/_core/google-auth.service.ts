import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

declare var google: any;

/**
 * Service wrapping Google Identity Services (GIS) — Authorization Code Flow.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private _loadPromise: Promise<void> | null = null;

  async loginWithRedirect(): Promise<void> {
    await this._ensureLoaded();
    google.accounts.oauth2
      .initCodeClient({
        client_id: environment.googleClientId,
        scope: 'openid email profile',
        ux_mode: 'redirect',
        redirect_uri: 'https://api.parko-wanko.pl/accounts/google/login/callback/',
      })
      .requestCode();
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
