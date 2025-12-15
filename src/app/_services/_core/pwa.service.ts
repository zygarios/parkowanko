import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { SharedUtilsService } from './shared-utils.service';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private _swUpdate = inject(SwUpdate);
  private _sharedUtilsService = inject(SharedUtilsService);

  initPwaUpdates() {
    if (this._swUpdate.isEnabled) {
      this._swUpdate.versionUpdates.subscribe((evt: VersionEvent) => {
        switch (evt.type) {
          case 'VERSION_DETECTED':
            console.log(`Dostępna jest nowa wersja aplikacji: ${evt.version.hash}`);
            break;
          case 'VERSION_READY':
            this._sharedUtilsService.openSnackbar(
              'Dostępna jest nowa wersja aplikacji.',
              'SUCCESS',
            );
            setTimeout(() => {
              window.location.reload();
            }, 3000);
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
