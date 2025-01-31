import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { map, of, switchMap, tap } from 'rxjs';
import { enterFadeAnimation } from '../../_others/animations/enter-fade-animation';
import { ParkingsService } from '../../_services/parkings-api.service';
import { SharedUtilsService } from '../../_services/shared-utils.service';
import { Parking } from '../../_types/parking.mode';
import { MapService } from '../map/map.service';

enum ActiveModeEnum {
  DEFAULT = 'DEFAULT',
  ADDING_POI = 'ADDING_POI',
  EDITING_POI = 'EDITING_POI',
  UPDATING_POI_POSITION = 'UPDATE_POI_POSITION',
}
@Component({
  selector: 'app-poi-controller',
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatBottomSheetModule,
  ],
  templateUrl: './poi-controller.component.html',
  styleUrl: './poi-controller.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [enterFadeAnimation],
})
export class PoiControllerComponent {
  private _mapService = inject(MapService);
  private _parkingsService = inject(ParkingsService);
  private _sharedUtilsService = inject(SharedUtilsService);

  ACTIVE_MODE_ENUM = ActiveModeEnum;
  activeMode: WritableSignal<ActiveModeEnum> = signal(ActiveModeEnum.DEFAULT);
  isMapLoaded = this._mapService.isMapLoaded;

  constructor() {
    effect(() => this._listenForSelectedPoiToStartEdit());
    effect(() => this._listenForActiveModeToSetMapState());
  }

  private _listenForSelectedPoiToStartEdit() {
    this._mapService.selectedParking();
    untracked(() => this.startEditingPoi());
  }
  private _listenForActiveModeToSetMapState() {
    this.activeMode();
    untracked(() => {
      if (this.activeMode() === ActiveModeEnum.DEFAULT) {
        this._mapService.selectedParking.set(null);
        this._mapService.setSelectingMode('enabled');
      } else {
        this._mapService.setSelectingMode('disabled');
      }
    });
  }

  startAddingPoi() {
    this.activeMode.set(ActiveModeEnum.ADDING_POI);
    this._mapService.renderMoveableMarker();
  }

  stopAddingPoi() {
    this._mapService.removeMoveableMarker();
    this.activeMode.set(ActiveModeEnum.DEFAULT);
  }

  confirmAddedPoi() {
    const location = this._mapService.getMarkerLatLng();
    this._parkingsService.postParking({ location }).subscribe({
      next: () => {
        this._sharedUtilsService.openSnackbar(
          'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
          'SUCCESS',
        );
      },
      complete: () => {
        this.stopAddingPoi();
      },
    });
  }

  startEditingPoi() {
    if (!this._mapService.selectedParking()) return;
    this.activeMode.set(ActiveModeEnum.EDITING_POI);
    const menuSheetItems = [
      {
        label: 'Popraw pozycję na mapie',
        icon: 'edit_location_alt',
        result: 'UPDATE',
      },
      {
        label: 'Usuń znacznik',
        icon: 'wrong_location',
        result: 'REMOVE',
      },
      {
        label: 'Anuluj',
        icon: 'close',
        result: 'CANCEL',
      },
    ];

    this._sharedUtilsService
      .openSheet(menuSheetItems)
      .afterDismissed()
      .subscribe((result: string | undefined) => {
        if (result === 'CANCEL' || !result) {
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        }
        if (result === 'UPDATE') this.startUpdatingPoiPosition();
        if (result === 'REMOVE') this.removePoi();
      });
  }

  startUpdatingPoiPosition() {
    const selectedPoi: Parking | null = this._mapService.selectedParking();
    if (!selectedPoi) return;
    this.activeMode.set(ActiveModeEnum.UPDATING_POI_POSITION);
    this._mapService.renderMoveableMarker();
    this._mapService.jumpToPoi(selectedPoi?.location);
  }

  stopUpdatingPoiPosition() {
    this._mapService.removeMoveableMarker();
    this.startEditingPoi();
  }

  confirmUpdatedPoiPosition() {
    const selectedPoi: Parking | null = this._mapService.selectedParking();
    if (!selectedPoi) return;
    const location = this._mapService.getMarkerLatLng();
    this._parkingsService.patchParking(selectedPoi.id, { location }).subscribe({
      next: () => {
        this._sharedUtilsService.openSnackbar(
          'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona',
          'SUCCESS',
        );
      },
      complete: () => {
        this._mapService.removeMoveableMarker();
        this.activeMode.set(ActiveModeEnum.DEFAULT);
      },
    });
  }

  removePoi() {
    const selectedPoi: Parking | null = this._mapService.selectedParking();
    if (!selectedPoi) return;
    this._mapService.jumpToPoi({
      lat: selectedPoi.location.lat - 0.001,
      lng: selectedPoi.location.lng,
    });

    this._mapService.renderMarkerForFocusPoi(selectedPoi.location);

    this._sharedUtilsService
      .openDialog({
        title: 'Usuwanie punktu',
        content: 'Czy na pewno chcesz usunąć obszar płatnego parkingu?',
      })
      .afterClosed()
      .pipe(
        switchMap((result: boolean) => {
          if (result) {
            return this._parkingsService
              .deleteParking(selectedPoi.id)
              .pipe(
                tap(() => {
                  this._sharedUtilsService.openSnackbar(
                    'Gotowe!\nUsunięto znacznik bezpłatnego parkingu',
                    'SUCCESS',
                  );
                }),
              )
              .pipe(map(() => true));
          } else {
            return of(false);
          }
        }),
      )
      .subscribe({
        next: (result) => {
          this._mapService.removeMarkerForFocusPoi();
          if (result) {
            this.activeMode.set(ActiveModeEnum.DEFAULT);
          } else {
            this.startEditingPoi();
          }
        },
      });
  }
}
