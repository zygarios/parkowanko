import { inject, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private _swUpdate = inject(SwUpdate);

  initPwaUpdates() {
    if (this._swUpdate.isEnabled) {
      this._swUpdate.versionUpdates.subscribe((evt) => {
        switch (evt.type) {
          case 'VERSION_DETECTED':
            console.log(`Dostępna jest nowa wersja aplikacji: ${evt.version.hash}`);
            break;
          case 'VERSION_READY':
            window.location.reload();
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.log(
              `Wystąpił błąd pobierania nowej wersji aplikacji: '${evt.version.hash}': ${evt.error}`,
            );
            break;
        }
      });
    }
  }
}
