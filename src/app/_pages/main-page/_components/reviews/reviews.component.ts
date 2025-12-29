import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ReviewsApiService } from '../../../../_services/_api/reviews-api.service';
import { ParkingPoint } from '../../../../_types/parking-point.type';
import { Review } from '../../../../_types/review.type';
import { ReviewComponent } from './review/review.component';
import { ReviewsSummaryComponent } from './reviews-summary/reviews-summary.component';

@Component({
  selector: 'app-reviews',
  imports: [MatDialogModule, MatButtonModule, ReviewComponent, ReviewsSummaryComponent],
  templateUrl: './reviews.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent {
  private readonly _reviewsApiService = inject(ReviewsApiService);

  readonly dialogData = inject<{ parkingPoint: ParkingPoint }>(MAT_DIALOG_DATA);

  readonly reviews = signal<Review[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor() {
    this._getReviews();
  }

  private async _getReviews() {
    this.isLoading.set(true);

    try {
      const reviews = await firstValueFrom(
        this._reviewsApiService.getReviews(this.dialogData.parkingPoint.id),
      );
      this.reviews.set(reviews);
    } finally {
      this.isLoading.set(false);
    }
  }
}
