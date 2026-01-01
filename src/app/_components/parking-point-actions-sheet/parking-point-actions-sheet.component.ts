import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, merge, Subject } from 'rxjs';
import { PoiActionsEnum } from '../../_pages/main-page/_components/map-ui-overlay/_types/poi-actions.model';
import { ReviewsVotesSummaryComponent } from '../../_pages/main-page/_components/reviews/reviews-votes-summary/reviews-votes-summary.component';
import { SheetRef } from '../../_types/sheet-ref.type';
import {
  ParkingPointActionsSheetData,
  ParkingPointActionsSheetResult,
} from './parking-point-actions-sheet.model';

@Component({
  selector: 'app-parking-point-actions-sheet',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    ReviewsVotesSummaryComponent,
    MatTooltipModule,
  ],
  templateUrl: './parking-point-actions-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingPointActionsSheetComponent {
  private sheetRef: MatBottomSheetRef = inject(MatBottomSheetRef);
  data: ParkingPointActionsSheetData = inject<ParkingPointActionsSheetData>(MAT_BOTTOM_SHEET_DATA);
  poiActionsEnum = PoiActionsEnum;

  menuItems = [
    {
      label: 'Nawiguj',
      icon: 'navigation',
      result: PoiActionsEnum.NAVIGATE,
      isPrimary: true,
    },
    {
      label: 'Dodaj opinię',
      icon: 'rate_review',
      result: PoiActionsEnum.ADD_REVIEW,
    },
    {
      label: 'Zobacz opinie',
      icon: 'forum',
      result: PoiActionsEnum.VIEW_REVIEWS,
    },
    {
      label: 'Popraw lokalizację',
      icon: 'edit_location_alt',
      result: PoiActionsEnum.UPDATE_LOCATION,
    },
  ];

  sheetComponentRef: SheetRef<ParkingPointActionsSheetResult> = {
    dismiss: () => this.sheetRef.dismiss(),
    onDismiss: new Subject<ParkingPointActionsSheetResult>(),
  };

  constructor() {
    this.handleCancelSheet();
  }

  handleCancelSheet() {
    // Obsługa zamykania menu po kliknięciu w tło lub wciśnięciu klawisza Escape
    merge(
      this.sheetRef.backdropClick(),
      this.sheetRef.keydownEvents().pipe(filter((event) => event.key === 'Escape')),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.sheetRef.dismiss();
        this.sheetComponentRef.onDismiss.next(PoiActionsEnum.DISMISS);
      });
  }

  choose(result: ParkingPointActionsSheetResult): void {
    this.sheetComponentRef.onDismiss.next(result);
  }

  ngOnDestroy() {
    this.sheetComponentRef.onDismiss.complete();
  }
}
