import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { PrivacyPolicyContentComponent } from './privacy-policy-content.component';

@Component({
  selector: 'app-privacy-policy-dialog',
  imports: [MatDialogModule, MatButtonModule, PrivacyPolicyContentComponent],
  template: `
    <h2 mat-dialog-title>Polityka Prywatności</h2>
    <mat-dialog-content>
      <app-privacy-policy-content />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Zamknij</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyDialogComponent {}
