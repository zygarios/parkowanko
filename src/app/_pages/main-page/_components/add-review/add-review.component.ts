import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { validationMessages } from '../../../../_others/_helpers/validation-messages';
import { ReviewSaveData } from '../../../../_types/review.model';
import { ReviewFormComponent } from './_components/review-form/review-form.component';

@Component({
  selector: 'app-add-review',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    ReviewFormComponent,
  ],
  templateUrl: './add-review.component.html',
  styles: `
    ::ng-deep mat-tab-header {
      display: none !important;
    }
    .success-icon {
      color: var(--par-color-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddReviewComponent {
  private stepsRef = viewChildren(MatTab);
  private dialogRef = inject(MatDialogRef);
  private dialogData = inject<{ parkingId: number }>(MAT_DIALOG_DATA);
  activeStep = signal(0);
  isFirstStep = computed(() => this.activeStep() === 0);
  isLastStep = computed(() => this.activeStep() === this.stepsRef().length - 1);

  review = signal<ReviewSaveData>({
    parkingId: this.dialogData.parkingId,
    description: '',
    attributes: [],
    occupancy: '',
    isLiked: true,
  });

  reviewForm = form(this.review, (path) => {
    required(path.occupancy, {
      message: validationMessages.required,
    });
  });

  constructor() {
    this.dialogRef.disableClose = true;
    if (!this.dialogData.parkingId) {
      throw new Error('Formularz dodawania opinii wymaga przekazanie parkingId w dialogData');
    }
  }

  addVote(isLiked: boolean) {
    this.review.update((review) => ({ ...review, isLiked }));
    this.nextStep();
  }

  nextStep() {
    this.activeStep.update((step) => {
      if (this.isLastStep()) return 0;
      return ++step;
    });
  }

  previousStep() {
    this.activeStep.update((step) => {
      if (step === 0) return this.stepsRef.length - 1;
      return --step;
    });
  }

  submitReview() {
    submit(this.reviewForm, async (form) => {
      this.nextStep();
      return null;
    });
  }
}
