import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-guide-dialog',
  imports: [MatStepperModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './guide-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideDialogComponent {
  private dialogRef = inject(MatDialogRef);

  constructor() {
    this.dialogRef.addPanelClass('dialog-fullscreen');
  }
}
