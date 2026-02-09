import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, merge, Subject } from 'rxjs';
import { ReviewsVotesSummaryComponent } from '../../_pages/main-page/_components/reviews/reviews-votes-summary/reviews-votes-summary.component';
import { ReviewsApiService } from '../../_services/_api/reviews-api.service';
import { AuthService } from '../../_services/_core/auth.service';
import { Review } from '../../_types/review.type';
import { SheetRef } from '../../_types/sheet-ref.type';
import {
  ParkingPointActionsSheetData,
  ParkingPointActionsSheetResult,
} from './parking-point-actions-sheet.type';

@Component({
  selector: 'app-parking-point-actions-sheet',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    ReviewsVotesSummaryComponent,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './parking-point-actions-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingPointActionsSheetComponent {
  private _authService = inject(AuthService);
  private _reviewsApiService = inject(ReviewsApiService);
  private _sheetRef: MatBottomSheetRef = inject(MatBottomSheetRef);
  data: ParkingPointActionsSheetData = inject<ParkingPointActionsSheetData>(MAT_BOTTOM_SHEET_DATA);
  poiActionsEnum = ParkingPointActionsSheetResult;

  private _reviews$ = this._reviewsApiService.getReviews(this.data.parkingPoint.id);
  reviews = toSignal<Review[] | null>(this._reviews$, { initialValue: null });

  menuItems = computed(() => {
    const userId = this._authService.currentUser()?.id;
    const currentReviews = this.reviews() || [];
    const isUserReview = currentReviews.some((review) => review.user.id === userId);
    const totalReviews = this.data.parkingPoint.likeCount + this.data.parkingPoint.dislikeCount;

    const reviewLabel = isUserReview ? 'Edytuj opinię' : 'Dodaj opinię';

    return [
      {
        label: 'Nawiguj',
        icon: 'navigation',
        result: ParkingPointActionsSheetResult.NAVIGATE,
        isPrimary: true,
      },
      {
        label: reviewLabel,
        icon: 'rate_review',
        result: ParkingPointActionsSheetResult.ADD_REVIEW,
      },
      {
        label: `Opinie (${totalReviews})`,
        icon: 'forum',
        result: ParkingPointActionsSheetResult.VIEW_REVIEWS,
      },
      {
        label: 'Popraw lokalizację',
        icon: 'edit_location_alt',
        result: ParkingPointActionsSheetResult.UPDATE_LOCATION,
      },
    ];
  });

  sheetComponentRef: SheetRef<ParkingPointActionsSheetResult> = {
    dismiss: () => this._sheetRef.dismiss(),
    onDismiss: new Subject<ParkingPointActionsSheetResult>(),
  };

  constructor() {
    this.handleCancelSheet();
  }

  handleCancelSheet() {
    // Obsługa zamykania menu po kliknięciu w tło lub wciśnięciu klawisza Escape
    merge(
      this._sheetRef.backdropClick(),
      this._sheetRef.keydownEvents().pipe(filter((event) => event.key === 'Escape')),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this._sheetRef.dismiss();
        this.sheetComponentRef.onDismiss.next(ParkingPointActionsSheetResult.DISMISS);
      });
  }

  choose(result: ParkingPointActionsSheetResult): void {
    this.sheetComponentRef.onDismiss.next(result);
  }

  ngOnDestroy() {
    this.sheetComponentRef.onDismiss.complete();
  }
}
