import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ReviewsApiService } from '../../../../_services/_api/reviews-api.service';
import { GlobalSpinnerService } from '../../../../_services/_core/global-spinner.service';
import { ParkingPoint } from '../../../../_types/parking-point.type';
import { Review } from '../../../../_types/review.type';
import { ReviewComponent } from './review/review.component';
import { ReviewsVotesSummaryComponent } from './reviews-votes-summary/reviews-votes-summary.component';

@Component({
  selector: 'app-reviews',
  imports: [MatDialogModule, MatButtonModule, ReviewComponent, ReviewsVotesSummaryComponent],
  templateUrl: './reviews.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent {
  private _reviewsApiService = inject(ReviewsApiService);
  private _globalSpinnerService = inject(GlobalSpinnerService);
  isSpinnerActive = this._globalSpinnerService.isSpinnerActive;

  dialogData = inject<{ parkingPoint: ParkingPoint }>(MAT_DIALOG_DATA);

  private _reviews = signal<Review[]>([]);
  reviews = computed(() =>
    this._reviews().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );

  constructor() {
    this._getReviews();
  }

  private async _getReviews() {
    this._globalSpinnerService.show('Pobieranie opinii...');
    try {
      const reviews = await firstValueFrom(
        this._reviewsApiService.getReviews(this.dialogData.parkingPoint.id),
      );
      this._reviews.set(reviews);
    } finally {
      this._globalSpinnerService.hide();
    }
  }
}
