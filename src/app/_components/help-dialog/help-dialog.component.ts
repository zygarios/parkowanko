import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-help-dialog',
  imports: [MatStepperModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialogComponent {
  private _dialogRef = inject(DialogRef);

  constructor() {
    this._dialogRef.addPanelClass('dialog-fullscreen');
  }
}
