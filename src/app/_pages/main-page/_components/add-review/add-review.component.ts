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
import { firstValueFrom } from 'rxjs';
import { validationMessages } from '../../../../_others/_helpers/validation-messages';
import { ReviewsApiService } from '../../../../_services/_api/reviews-api.service';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { ReviewSaveData } from '../../../../_types/review.type';
import { ReviewFormComponent } from './_components/review-form/review-form.component';
import { Occupancy } from './_types/occupancy.model';

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
  private _dialogRef = inject(MatDialogRef);
  private _reviewsApiService = inject(ReviewsApiService);
  private _sharedUtilsService = inject(SharedUtilsService);
  private _dialogData = inject<{ parkingPointId: number; skipVoteStep?: boolean }>(MAT_DIALOG_DATA);
  private _stepsRef = viewChildren(MatTab);

  skipVoteStep = this._dialogData.skipVoteStep;
  activeStep = signal(0);
  isFirstStep = computed(() => this.activeStep() === 0);
  isLastStep = computed(() => this.activeStep() === this._stepsRef().length - 1);

  review = signal<ReviewSaveData>({
    parkingPointId: this._dialogData.parkingPointId,
    description: '',
    attributes: [],
    occupancy: '' as Occupancy,
    isLike: true,
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
    if (this._dialogData.skipVoteStep) this.nextStep();
  }

  addVote(isLiked: boolean) {
    this.review.update((review) => ({ ...review, isLiked }));
    this.nextStep();
  }

  nextStep() {
    this.activeStep.update((step) => {
      if (this.isLastStep()) return step;
      return ++step;
    });
  }

  previousStep() {
    this.activeStep.update((step) => {
      if (this.skipVoteStep && step === 1) return step;
      if (step === 0) return step;
      return --step;
    });
  }

  submitReview() {
    submit(this.reviewForm, async () => {
      try {
        await firstValueFrom(
          this._reviewsApiService.postReview(this._dialogData.parkingPointId, this.review()),
        );
        this._sharedUtilsService.openSnackbar(
          'Dodałeś/aś opinię! Przyszli kierowcy będą ci wdzięczni. ;)',
          'SUCCESS',
        );
        this._dialogRef.close();
        return;
      } catch (_) {
        this._sharedUtilsService.openSnackbar('Wystąpił błąd podczas dodawania oceny', 'ERROR');
        return;
      }
    });
  }
}
