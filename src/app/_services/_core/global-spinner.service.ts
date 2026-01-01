import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, effect, inject, Injectable, signal } from '@angular/core';
import { GlobalSpinnerComponent } from '../../_components/global-spinner/global-spinner.component';

@Injectable({
  providedIn: 'root',
})
export class GlobalSpinnerService {
  private readonly _overlay = inject(Overlay);
  private _componentRef: ComponentRef<GlobalSpinnerComponent> | null = null;

  private _overlayRef: OverlayRef = this._overlay.create({
    hasBackdrop: false,
    positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: this._overlay.scrollStrategies.block(),
    width: '100%',
    height: '100%',
  });

  private _spinnerPortal = new ComponentPortal(GlobalSpinnerComponent);

  private _isSpinnerActive = signal(false);

  isSpinnerActive = this._isSpinnerActive.asReadonly();
  message = signal<string | null>(null);

  constructor() {
    this.listenForSpinnerStateChange();
  }

  show(message?: string) {
    this.message.set(message || null);
    this._isSpinnerActive.set(true);
  }

  hide(delay: number = 500) {
    setTimeout(() => {
      this._isSpinnerActive.set(false);
      this.message.set(null);
    }, delay);
  }

  private listenForSpinnerStateChange() {
    effect(() => {
      const isOpen = this.isSpinnerActive();
      const msg = this.message();
      if (isOpen) {
        if (!this._overlayRef.hasAttached()) {
          this._componentRef = this._overlayRef.attach(this._spinnerPortal);
        }
        this._componentRef?.setInput('message', msg || '');
      } else {
        if (this._overlayRef.hasAttached()) {
          this._overlayRef.detach();
          this._componentRef = null;
        }
      }
    });
  }
}
