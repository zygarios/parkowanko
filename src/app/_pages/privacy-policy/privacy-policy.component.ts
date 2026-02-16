import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PrivacyPolicyContentComponent } from './privacy-policy-content.component';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink, MatButtonModule, MatIconModule, PrivacyPolicyContentComponent],
  template: `
    <div class="bg-[#f5f5f5] min-h-full p-5">
      <div
        class="max-w-[800px] mx-auto p-10 max-sm:p-5 bg-white rounded-xl shadow-sm text-[#242424] leading-relaxed"
      >
        <header class="flex items-center gap-4 pb-2.5">
          <button mat-icon-button routerLink="/" aria-label="Wróć do aplikacji">
            <mat-icon>home</mat-icon>
          </button>
          <h1 class="font-big m-0">Polityka Prywatności</h1>
        </header>

        <hr />

        <app-privacy-policy-content />

        <a
          routerLink="/"
          class="inline-block mt-10 no-underline text-(--par-color-primary) font-medium hover:underline"
          >Wróć do aplikacji</a
        >
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {}
