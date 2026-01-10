import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ComputedFuncPipe } from '../../../../../../_others/_helpers/computed-func.pipe';
import { GeocodeFeature } from '../../../../../../_types/geocode-api.type';
import { AddressSearchService } from '../../../../_services/address-search.service';
import { MapService } from '../../../../_services/map/map.service';

@Component({
  selector: 'app-address-search-box',
  imports: [
    MatIconModule,
    MatFormField,
    MatInputModule,
    MatAutocompleteModule,
    ComputedFuncPipe,
    MatButtonModule,
    FormField,
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
  private readonly _addressSearchService = inject(AddressSearchService);
  private readonly _mapService = inject(MapService);
  private readonly _searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInputRef');

  selectedAddressEmitter = output<GeocodeFeature | null>();

  addressSearchTerm = signal('');
  selectedAddress = this._addressSearchService.selectedAddress;
  selectedAddressForm = form(this.selectedAddress);

  addressesList = this._addressSearchService.getAddressesBySearchTerm(this.addressSearchTerm);

  constructor() {
    effect(() => this.selectedAddressEmitter.emit(this.selectedAddress()));
  }

  resetInput() {
    this.addressSearchTerm.set('');
    this.selectedAddress.set(null);
    this._searchInputRef()!.nativeElement.value = '';
  }

  parseAddressToString(address: GeocodeFeature | null) {
    if (!address) return '';
    return address.details.name;
  }
}
