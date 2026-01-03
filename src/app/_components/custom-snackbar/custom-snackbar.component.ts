import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface CustomSnackbarData {
  title: string;
  type: 'ERROR' | 'SUCCESS' | 'DEFAULT';
}

@Component({
  selector: 'app-custom-snackbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './custom-snackbar.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSnackbarComponent {
  snackBarRef = inject(MatSnackBarRef);
  data: CustomSnackbarData = inject(MAT_SNACK_BAR_DATA);

  colorVar = computed(() => {
    switch (this.data.type) {
      case 'SUCCESS':
        return 'var(--par-color-success)';
      case 'ERROR':
        return 'var(--par-color-error)';
      default:
        return 'var(--par-color-primary)';
    }
  });
}
