import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ParkingPointActionsSheetComponent } from '../../_components/parking-point-actions-sheet/parking-point-actions-sheet.component';
import { ParkingPointActionsSheetData } from '../../_components/parking-point-actions-sheet/parking-point-actions-sheet.model';
import { GeocodeApiService } from '../_api/geocode-api.service';
import { SharedUtilsService } from './shared-utils.service';

@Injectable({
  providedIn: 'root',
})
export class ParkingPointActionsSheetService {
  private _sharedUtilsService = inject(SharedUtilsService);
  private readonly _geocodeApiService = inject(GeocodeApiService);

  openSheet(
    data: ParkingPointActionsSheetData,
    config?: { disableClose?: boolean; hasBackdrop?: boolean },
  ) {
    return this._geocodeApiService.getAddressByCoordinates(data.parkingPoint.location).pipe(
      map((addressLabel) => {
        return this._sharedUtilsService.openSheet(
          ParkingPointActionsSheetComponent,
          { parkingPoint: data.parkingPoint, addressLabel },
          config,
        );
      }),
    );
  }
}
