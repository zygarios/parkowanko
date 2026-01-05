import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ParkingPointActionsSheetData } from '../../../../_components/parking-point-actions-sheet/parking-point-actions-sheet.type';
import { GlobalSpinnerService } from '../../../../_services/_core/global-spinner.service';
import { ReviewComponent } from './review/review.component';
import { ReviewsVotesSummaryComponent } from './reviews-votes-summary/reviews-votes-summary.component';

@Component({
  selector: 'app-reviews',
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReviewComponent,
    ReviewsVotesSummaryComponent,
    MatIconModule,
  ],
  templateUrl: './reviews.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent {
  private _globalSpinnerService = inject(GlobalSpinnerService);

  isSpinnerActive = this._globalSpinnerService.isSpinnerActive;

  dialogData = inject<ParkingPointActionsSheetData>(MAT_DIALOG_DATA);
  reviews = this.dialogData.reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
