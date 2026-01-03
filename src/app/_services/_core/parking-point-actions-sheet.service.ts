import { inject, Injectable } from '@angular/core';
import { ParkingPointActionsSheetComponent } from '../../_components/parking-point-actions-sheet/parking-point-actions-sheet.component';
import { ParkingPointActionsSheetData } from '../../_components/parking-point-actions-sheet/parking-point-actions-sheet.model';
import { SharedUtilsService } from './shared-utils.service';

@Injectable({
  providedIn: 'root',
})
export class ParkingPointActionsSheetService {
  private _sharedUtilsService = inject(SharedUtilsService);

  openSheet(
    data: ParkingPointActionsSheetData,
    config?: { disableClose?: boolean; hasBackdrop?: boolean },
  ) {
    return this._sharedUtilsService.openSheet(
      ParkingPointActionsSheetComponent,
      { parkingPoint: data.parkingPoint },
      config,
    );
  }
}
