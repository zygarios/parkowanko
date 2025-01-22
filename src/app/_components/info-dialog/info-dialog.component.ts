import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface InfoDialogData {
  title: string;
  content: string;
  cancelButtonLabel?: string;
  confirmButtonLabel?: string;
  hideCancelButton?: boolean;
  hideConfirmButton?: boolean;
  isConfirmErrorButton?: boolean;
}
@Component({
  selector: 'app-info-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoDialogComponent {
  dialogData: InfoDialogData = inject(MAT_DIALOG_DATA);

  constructor() {
    this.dialogData = {
      title: '',
      content: '',
      cancelButtonLabel: 'Anuluj',
      confirmButtonLabel: 'Potwierdź',
      hideCancelButton: false,
      hideConfirmButton: false,
      isConfirmErrorButton: true,
    };
  }
}
