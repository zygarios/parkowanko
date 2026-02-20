import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SocialLoginService } from './social-login.service';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

declare var google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private _socialLoginService = inject(SocialLoginService);
  private _loadPromise: Promise<void> | null = null;
  private _isInitialized = false;

  /**
   * Initializes Google Identity Services and attempts to show One Tap prompt.
   */
  async initializeAndPrompt(): Promise<void> {
    await this._ensureLoaded();

    if (!this._isInitialized) {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this._handleCredentialResponse(response),
        auto_select: false,
        use_fedcm_for_prompt: true, // Nowy standard Google
      });
      this._isInitialized = true;
    }

    google.accounts.id.prompt((notification: any) => {
      console.log('--- One Tap Status ---');
      console.log('Status:', notification.getMomentType());
      if (notification.isNotDisplayed()) {
        console.warn('Powód braku wyświetlenia:', notification.getNotDisplayedReason());
      }
      if (notification.isSkippedMoment()) {
        console.warn('Pominięto wyświetlanie:', notification.getSkippedReason());
      }
    });
  }

  /**
   * Renders the standard Google Sign-In button into the provided element.
   */
  renderButton(elementId: string): void {
    if (!this._isInitialized) return;

    google.accounts.id.renderButton(document.getElementById(elementId), {
      theme: 'outline',
      size: 'large',
      width: '100%',
      shape: 'pill',
    });
  }

  private _handleCredentialResponse(response: any): void {
    if (response.credential) {
      this._socialLoginService.loginWithGoogleCredential(response.credential).subscribe();
    }
  }

  private _ensureLoaded(): Promise<void> {
    if (!this._loadPromise) {
      this._loadPromise = this._loadScript();
    }
    return this._loadPromise;
  }

  private _loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
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
