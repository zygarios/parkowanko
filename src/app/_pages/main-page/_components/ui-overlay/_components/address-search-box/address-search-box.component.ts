import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ComputedFuncPipe } from '../../../../../../_others/_helpers/computed-func.pipe';
import { GeocodeFeature } from '../../../../../../_types/geocode-api.type';
import { MapService } from './../../../map/_services/map.service';
import { AddressSearchBoxService } from './address-search-box.service';

@Component({
  selector: 'app-address-search-box',
  imports: [
    MatIconModule,
    MatFormField,
    MatInputModule,
    MatAutocompleteModule,
    Field,
    ComputedFuncPipe,
    MatButtonModule,
  ],
  templateUrl: './address-search-box.component.html',
  styles: `
    :host {
      --mat-form-field-container-text-size: 14px;
      --mat-form-field-outlined-outline-color: var(--par-color-primary);
      --mat-form-field-outlined-outline-width: 2px;
      --mat-form-field-outlined-container-shape: var(--mat-sys-corner-large);
      --mat-fab-container-elevation-shadow: none;

      flex: 1;

      ::ng-deep {
        .mat-mdc-text-field-wrapper {
          border-radius: var(--mat-form-field-outlined-container-shape) !important;
        }
        mat-form-field {
          margin-bottom: 0 !important;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressSearchBoxComponent {
  private readonly addressSearchBoxService = inject(AddressSearchBoxService);
  private readonly mapService = inject(MapService);
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInputRef');

  selectedAddressEmitter = output<GeocodeFeature | null>();
  addressSearchTerm = signal('');
  selectedAddress = signal<GeocodeFeature | null>(null);
  selectedAddressForm = form(this.selectedAddress);

  addressesList = this.addressSearchBoxService.getAddressesBySearchTerm(this.addressSearchTerm);

  constructor() {
    this.listenForAddressChange();
  }

  listenForAddressChange() {
    effect(() => {
      this.selectedAddress();
      untracked(() => {
        this.selectedAddressEmitter.emit(this.selectedAddress());
        this.flyToSelectedAddress();
      });
    });
  }

  flyToSelectedAddress() {
    if (!this.selectedAddress()) return;
    this.mapService.flyToPoi(
      {
        lng: Number(this.selectedAddress()!.coords.lng),
        lat: Number(this.selectedAddress()!.coords.lat),
      },
      'miejsc_nazwa' in this.selectedAddress()?.details! ? 'FAR_ZOOM' : 'CLOSE_ZOOM',
    );
  }

  resetInput() {
    this.addressSearchTerm.set('');
    this.selectedAddress.set(null);
    this.searchInputRef()!.nativeElement.value = '';
  }

  parseAddressToString(address: GeocodeFeature | null, isOptionLabel: boolean = false) {
    if (!address) return '';
    return address.details.name;
  }
}
