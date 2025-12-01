import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-guide-dialog',
  imports: [MatStepperModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './guide-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      ::ng-deep .mat-step-label {
        display: none !important;
      }
      ::ng-deep .mat-horizontal-stepper-header-container {
        position: sticky;
        top: 0;
        background-color: var(--mat-sys-surface);
      }
    }
  `,
})
export class GuideDialogComponent {
  private _dialogRef = inject(DialogRef);

  constructor() {
    this._dialogRef.addPanelClass('dialog-fullscreen');
  }
}
