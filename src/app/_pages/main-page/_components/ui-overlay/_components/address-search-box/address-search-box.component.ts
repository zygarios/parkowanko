import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
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
import { Localization, LocalizationType } from '../../../../../../_types/geocode-api.type';
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

  addressSearchTerm = signal('');
  selectedAddress = signal<Localization | null>(null);
  selectedAddressForm = form(this.selectedAddress);

  addressesList = this.addressSearchBoxService.getAddressesBySearchTerm(this.addressSearchTerm);

  constructor() {
    this.listenForAddressChange();
  }

  listenForAddressChange() {
    effect(() => {
      this.selectedAddress();
      untracked(() => {
        if (this.selectedAddress()) {
          this.mapService.flyToPoi(
            {
              lng: Number(this.selectedAddress()!.x),
              lat: Number(this.selectedAddress()!.y),
            },
            this.selectedAddress()!.type === LocalizationType.CITY ? 'FAR_ZOOM' : 'CLOSE_ZOOM',
          );
        }
      });
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
