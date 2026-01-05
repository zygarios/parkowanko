import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-guide-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './guide-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col h-full',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
  styles: `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class GuideDialogComponent {
  private dialogRef = inject(MatDialogRef);
  private touchStartX = 0;

  currentStep = signal(1);
  STEPS_LENGTH = 3;

  constructor() {
    // this.dialogRef.addPanelClass();
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = this.touchStartX - touchEndX;

    // Przesunięcie w lewo -> Następny (deltaX > 50)
    // Przesunięcie w prawo -> Poprzedni (deltaX < -50)
    if (deltaX > 50) {
      this.next();
    } else if (deltaX < -50) {
      this.prev();
    }
  }

  next() {
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prev() {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  goToStep(step: number) {
    this.currentStep.set(step);
  }
}
