import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GoogleAuthService } from '../../../../_services/_core/google-auth.service';

@Component({
  selector: 'app-social-auth-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-3 w-full">
      <!-- Google Sign-In Button Container -->
      <div id="google-btn-container" class="w-full flex justify-center min-h-[44px]"></div>

      <!-- Informacja o One Tap (opcjonalnie, One Tap i tak się pojawi) -->
    </div>
  `,
  styles: `
    #google-btn-container {
      margin-top: 0.5rem;
    }

    /* Zapewnienie, że przycisk Google jest wycentrowany i responsywny */
    :host ::ng-deep .S9790d-Pd933ed {
      border-radius: 0.75rem !important;
    }
  `,
})
export class SocialAuthButtonsComponent implements AfterViewInit {
  private _googleAuth = inject(GoogleAuthService);

  async ngAfterViewInit(): Promise<void> {
    try {
      // Inicjalizacja GIS i próba wyświetlenia One Tap
      await this._googleAuth.initializeAndPrompt();

      // Renderowanie standardowego przycisku Google
      this._googleAuth.renderButton('google-btn-container');
    } catch (err) {
      console.error('Błąd inicjalizacji Google Auth:', err);
    }
  }
}
