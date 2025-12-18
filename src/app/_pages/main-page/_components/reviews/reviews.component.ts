import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { RelativeTimePipe } from '../../../../_pipes/relative-time.pipe';
import { ReviewsApiService } from '../../../../_services/_api/reviews-api.service';
import { Review } from '../../../../_types/review.type';

@Component({
  selector: 'app-reviews',
  imports: [MatChipsModule, MatDialogModule, MatButtonModule, DatePipe, RelativeTimePipe],
  templateUrl: './reviews.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent {
  private _dialogData = inject<{ parkingPointId: number }>(MAT_DIALOG_DATA);
  private _reviewsApiService = inject(ReviewsApiService);
  reviews = signal<Review[]>([]);
  isLoading = signal<boolean>(false);

  constructor() {
    this._getReviews();
  }

  private async _getReviews() {
    this.isLoading.set(true);

    try {
      const reviews = await firstValueFrom(
        this._reviewsApiService.getReviews(this._dialogData.parkingPointId),
      );
      this.reviews.set(reviews);
    } finally {
      this.isLoading.set(false);
    }
  }
}
