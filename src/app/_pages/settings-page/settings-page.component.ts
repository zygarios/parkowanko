import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { RouterPaths } from '../../_others/_helpers/router-paths';
import { AuthService } from '../../_services/_core/auth.service';
import { SharedUtilsService } from '../../_services/_core/shared-utils.service';

@Component({
  selector: 'app-settings-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    RouterLink,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
  ],
  template: `
    <mat-toolbar class="bg-white! border-b border-slate-200! px-4! h-[64px]! sticky top-0 z-10">
      <button mat-icon-button routerLink="/">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span class="ml-2 par-font-large7">Ustawienia</span>
    </mat-toolbar>

    <div class="flex flex-col gap-[30px] p-(--par-container-padding)">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Moje dane</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="flex justify-between items-center">
            <span class="par-font-small">Nazwa użytkownika:</span>
            <span class="par-font-small">{{ user()?.username || '—' }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Usuwanie konta</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="flex flex-col gap-[20px]">
            <p class="par-font-small">
              Usunięcie konta jest operacją nieodwracalną. Wszystkie Twoje dane, w tym historia i
              zapisane miejsca, zostaną trwale usunięte.
            </p>
            <button mat-button class="ml-auto text-(--par-color-error)!" (click)="deleteAccount()">
              Usuń konto
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private _authService = inject(AuthService);
  private _sharedUtilsService = inject(SharedUtilsService);
  private _router = inject(Router);

  user = this._authService.currentUser;

  deleteAccount() {
    this._sharedUtilsService
      .openInfoDialog({
        title: 'Usuwanie konta',
        content: 'Czy na pewno chcesz trwale usunąć swoje konto? Tej operacji nie można cofnąć.',
        confirmButtonLabel: 'Usuń bezpowrotnie',
        cancelButtonLabel: 'Anuluj',
        isConfirmErrorButton: true,
      })
      .afterClosed()
      .pipe(filter((result) => !!result))
      .subscribe(() => {
        this._authService.deleteAccount().subscribe(() => {
          this._router.navigate([RouterPaths.AUTH_LOGIN]);
        });
      });
  }
}
