import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ComputedFuncPipe } from '../../../../../../_others/_helpers/computed-func.pipe';
import { Localization, LocalizationType } from '../../../../../../_types/geocode-api.model';
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
      flex: 1;
      --mat-form-field-container-text-size: 14px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressSearchBoxComponent {
  private readonly addressSearchBoxService = inject(AddressSearchBoxService);
  private readonly mapService = inject(MapService);
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInputRef');

  addressSearchTerm = signal('');
  selectedAddress = signal<Localization | null>(null);
  selectedAddressForm = form(this.selectedAddress);

  addressesList = this.addressSearchBoxService.getAddressesBySearchTerm(this.addressSearchTerm);

  constructor() {
    this.listenForAddressChange();
  }

  listenForAddressChange() {
    effect(() => {
      if (this.selectedAddress()) {
        this.mapService.jumpToPoi(
          {
            lng: Number(this.selectedAddress()!.x),
            lat: Number(this.selectedAddress()!.y),
          },
          this.selectedAddress()!.type === LocalizationType.CITY ? 'FAR_ZOOM' : 'CLOSE_ZOOM',
        );
      }
    });
  }

  resetInput() {
    this.addressSearchTerm.set('');
    this.selectedAddress.set(null);
    this.searchInputRef()!.nativeElement.value = '';
  }

  parseAddressToString(address: Localization | null, isOptionLabel: boolean = false) {
    if (!address) return '';

    let addressSuggestion = address.city;

    if ('street' in address && address.street) {
      addressSuggestion = addressSuggestion + `, ${address.street}`;

      if ('number' in address && address.number) {
        addressSuggestion = addressSuggestion + ` ${address.number}`;
      }
    } else if (isOptionLabel && 'voivodeship' in address && address.voivodeship) {
      addressSuggestion = addressSuggestion + ` (${address.voivodeship})`;
    }

    return addressSuggestion;
  }
}
