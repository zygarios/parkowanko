import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { environment } from '../environments/environment.development';
import { PwaService } from './_services/_core/pwa.service';
import { SharedUtilsService } from './_services/_core/shared-utils.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  styles: ``,
  templateUrl: './app.component.html',
})
export class AppComponent {
  private _pwaService = inject(PwaService);
  private _swUpdate = inject(SwUpdate);
  private _sharedUtilsService = inject(SharedUtilsService);
  pwaStatus = signal('');
  environmentType = environment.environmentType;

  constructor() {
    this._pwaService.initPwaUpdates();
    this.setEnvData();
    this.checkGpsStatus();
  }

  async checkGpsStatus() {
    const showErr = (msg: string) => this._sharedUtilsService.openSnackbar(msg, 'ERROR');

    if (!('geolocation' in navigator))
      return showErr('Twoje urządzenie nie obsługuje lokalizacji GPS.');

    navigator.geolocation.getCurrentPosition(
      () => console.log('GPS OK'),
      (err) => {
        if (err.code === err.PERMISSION_DENIED || err.code === err.POSITION_UNAVAILABLE) {
          showErr('GPS jest wyłączony lub nie ma uprawnień do GPS.');
        }
      },
      { timeout: 3000, enableHighAccuracy: false },
    );
  }

  setEnvData() {
    if (this._swUpdate.isEnabled) {
      this._swUpdate.versionUpdates.subscribe((evt: VersionEvent) => {
        this.pwaStatus.set(evt.type);
      });
    } else {
      this.pwaStatus.set('SW_DISABLED');
    }
  }
}
