import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { effect, inject, Injectable, signal } from '@angular/core';
import { GlobalSpinnerComponent } from '../../_components/global-spinner/global-spinner.component';

@Injectable({
  providedIn: 'root',
})
export class GlobalSpinnerService {
  private readonly _overlay = inject(Overlay);

  private _overlayRef = this._overlay.create({
    hasBackdrop: false,
    positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: this._overlay.scrollStrategies.block(),
    width: '100%',
    height: '100%',
  });

  private _spinnerPortal = new ComponentPortal(GlobalSpinnerComponent);

  isSpinnerActive = signal(false);

  constructor() {
    this.listenForSpinnerStateChange();
  }

  private listenForSpinnerStateChange() {
    effect(() => {
      const isOpen = this.isSpinnerActive();

      if (isOpen) {
        this.showSpinner();
      } else {
        this.hideSpinner();
      }
    });
  }

  private showSpinner() {
    if (!this._overlayRef.hasAttached()) {
      this._overlayRef.attach(this._spinnerPortal);
    }
  }

  private hideSpinner() {
    if (this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }
  }
}
