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
    width: '100%',
    height: '100%',
    panelClass: 'global-spinner-overlay',
  });

  private _spinnerPortal = new ComponentPortal(GlobalSpinnerComponent);

  private _isSpinnerActive = signal(false);
  private _message = signal<string | null>(null);
  private _hasBackdrop = signal(false);

  isSpinnerActive = this._isSpinnerActive.asReadonly();

  constructor() {
    this.listenForSpinnerStateChange();
  }

  show({ message, hasBackdrop }: { message?: string; hasBackdrop: boolean }) {
    this._message.set(message || null);
    this._hasBackdrop.set(hasBackdrop);
    this._isSpinnerActive.set(true);
  }

  hide(delay: number = 500) {
    setTimeout(() => {
      this._isSpinnerActive.set(false);
      this._message.set(null);
      this._hasBackdrop.set(false);
    }, delay);
  }

  private listenForSpinnerStateChange() {
    effect(() => {
      const isOpen = this.isSpinnerActive();
      const msg = this._message();
      const hasBackdrop = this._hasBackdrop();
      if (isOpen) {
        if (!this._overlayRef.hasAttached()) {
          this._componentRef = this._overlayRef.attach(this._spinnerPortal);
        }
        this._componentRef?.setInput('message', msg);
        this._componentRef?.setInput('hasBackdrop', hasBackdrop);
      } else {
        if (this._overlayRef.hasAttached()) {
          this._overlayRef.detach();
          this._componentRef = null;
        }
      }
    });
  }
}
