import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalSpinnerService {
  private readonly _document = inject(DOCUMENT);

  private _isSpinnerActiveCount = signal(0);

  isSpinnerActive = computed(() => this._isSpinnerActiveCount() > 0);

  show() {
    this._isSpinnerActiveCount.update((count) => ++count);
    this._updateDOM();
  }

  hide(delay: number = 0) {
    setTimeout(() => {
      this._isSpinnerActiveCount.update((count) => (count === 0 ? 0 : --count));
      this._updateDOM();
    }, delay);
  }

  private _updateDOM() {
    const spinnerElement = this._document.getElementById('global-spinner');
    const appElement = this._document.getElementsByTagName('app-root')[0] as HTMLElement;

    if (!spinnerElement || !appElement) return;

    spinnerElement.style.display = this.isSpinnerActive() ? 'flex' : 'none';
    appElement.style.zIndex = this.isSpinnerActive() ? '-1' : '0';
    appElement.style.position = this.isSpinnerActive() ? 'relative' : 'static';
  }
}
