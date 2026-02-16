import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { firstValueFrom } from 'rxjs';
import { validationMessages } from '../../../../_others/_helpers/validation-messages';
import { ReviewsApiService } from '../../../../_services/_api/reviews-api.service';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { Review, ReviewSaveData } from '../../../../_types/review.type';
import { ReviewFormComponent } from './_components/review-form/review-form.component';
import { Occupancy } from './_types/occupancy.model';
import { ReviewStep } from './_types/review-step.enum';

@Component({
  selector: 'app-add-review',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,

    MatInputModule,
    MatSelectModule,
    ReviewFormComponent,
  ],
  templateUrl: './add-review.component.html',
  styles: `
    .step-content {
      animation: fadeIn 0.3s ease-in-out;
    }
    .success-icon {
      color: var(--par-color-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddReviewComponent {
  private _dialogRef = inject(MatDialogRef);
  private _reviewsApiService = inject(ReviewsApiService);
  private _sharedUtilsService = inject(SharedUtilsService);
  private _dialogData = inject<{
    parkingPointId: number;
    parkingAddress?: string | null;
    skipVoteStep?: boolean;
    userReview?: Review;
    isReviewForLastNavigatedParking?: boolean;
  }>(MAT_DIALOG_DATA);

  protected readonly ReviewStep = ReviewStep;

  parkingAddress = this._dialogData.parkingAddress;
  isReviewForLastNavigatedParking = this._dialogData.isReviewForLastNavigatedParking;
  skipVoteStep = this._dialogData.skipVoteStep;
  activeStep = signal<ReviewStep>(ReviewStep.Vote);
  isFirstStep = computed(() => this.activeStep() === ReviewStep.Vote);
  isLastStep = computed(() => this.activeStep() === ReviewStep.ThankYou);

  review = signal<ReviewSaveData>({
    parkingPointId: this._dialogData.parkingPointId,
    description: this._dialogData.userReview?.description || '',
    attributes: this._dialogData.userReview?.attributes || [],
    occupancy: this._dialogData.userReview?.occupancy || ('' as Occupancy),
    isLike: this._dialogData.userReview?.isLike ?? true,
  });

  reviewForm = form(this.review, (path) => {
    required(path.occupancy, {
      message: validationMessages.required,
    });
  });

  constructor() {
    this._dialogRef.disableClose = true;
    if (!this._dialogData.parkingPointId && this._dialogData.parkingPointId !== 0) {
      throw new Error('Formularz dodawania opinii wymaga przekazanie parkingPointId w dialogData');
    }
    if (this._dialogData.skipVoteStep) this.activeStep.set(ReviewStep.Comment);
  }

  addVote(isLike: boolean) {
    this.review.update((review) => ({ ...review, isLike }));
    this.activeStep.set(ReviewStep.Comment);
  }

  submitReview() {
    submit(this.reviewForm, async () => {
      try {
        if (this._dialogData.userReview) {
          await firstValueFrom(
            this._reviewsApiService.putReview(
              this._dialogData.parkingPointId,
              this._dialogData.userReview.id,
              this.review(),
            ),
          );
        } else {
          await firstValueFrom(
            this._reviewsApiService.postReview(this._dialogData.parkingPointId, this.review()),
          );
        }

        this._sharedUtilsService.openSnackbar(
          this._dialogData.userReview
            ? 'Opinia zaktualizowana!'
            : 'Opinia dodana! Przyszli kierowcy będą ci wdzięczni. ;)',
          'SUCCESS',
        );
        this.activeStep.set(ReviewStep.ThankYou);
        return;
      } catch (_) {
        this._sharedUtilsService.openSnackbar(
          `Wystąpił błąd podczas ${this._dialogData.userReview ? 'aktualizacji' : 'dodawania'} oceny`,
          'ERROR',
        );
        return;
      }
    });
  }
}
