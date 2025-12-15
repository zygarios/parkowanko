import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { environment } from '../environments/environment.development';
import { PwaService } from './_services/_core/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  styles: ``,
  templateUrl: './app.component.html',
})
export class AppComponent {
  private _pwaService = inject(PwaService);
  private _swUpdate = inject(SwUpdate);
  pwaHash = signal('');
  environmentType = environment.environmentType;

  constructor() {
    this._pwaService.initPwaUpdates();
    this.setEnvData();
  }

  setEnvData() {
    this.pwaHash.set(`NO_NEW${1}`);
    this._swUpdate.versionUpdates.subscribe((evt: VersionEvent) => {
      switch (evt.type) {
        case 'NO_NEW_VERSION_DETECTED':
          this.pwaHash.set(`NO_NEW${evt.version.hash}`);
          break;
        case 'VERSION_DETECTED':
          this.pwaHash.set(`NEW_DETECTED${evt.version.hash}`);
          break;
        case 'VERSION_INSTALLATION_FAILED':
          this.pwaHash.set(`VERSION_INSTALLATION_FAILED${evt.version.hash}`);
          break;
      }
    });
  }
}
