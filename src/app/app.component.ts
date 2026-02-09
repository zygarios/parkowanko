import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { PwaService } from './_services/_core/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private _pwaService = inject(PwaService);
  private _swUpdate = inject(SwUpdate);
  pwaStatus = signal('');
  environmentType = environment.environmentType;

  constructor() {
    this._pwaService.initPwaUpdates();
    this.setEnvData();
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
