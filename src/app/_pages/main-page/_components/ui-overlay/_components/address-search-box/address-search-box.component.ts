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
import { GeocodeAddress } from '../../../../../../_types/geocode-api.model';
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
  selectedAddress = signal<GeocodeAddress | null>(null);
  selectedAddressForm = form(this.selectedAddress);

  addressesList = this.addressSearchBoxService.getAddressesBySearchTerm(this.addressSearchTerm);

  constructor() {
    effect(() => {
      if (this.selectedAddress()) {
        this.mapService.jumpToPoi({
          lng: Number(this.selectedAddress()!.x),
          lat: Number(this.selectedAddress()!.y),
        });
      }
    });
  }

  resetInput() {
    this.addressSearchTerm.set('');
    this.selectedAddress.set(null);
    this.searchInputRef()!.nativeElement.value = '';
  }

  parseAddressToString(address: GeocodeAddress | null) {
    if (!address) return '';

    let addressSuggestion = address.city;
    if (address.street) {
      addressSuggestion = addressSuggestion + `, ${address.street}`;
    }
    if (address.number) {
      addressSuggestion = addressSuggestion + ` ${address.number}`;
    }
    return addressSuggestion;
  }
}
