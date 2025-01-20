import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-info-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoDialogComponent {}
