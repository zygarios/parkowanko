import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaService } from './_services/_core/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  styles: ``,
  templateUrl: './app.component.html',
})
export class AppComponent {
  private _pwaService = inject(PwaService);

  constructor() {
    this._pwaService.initPwaUpdates();
  }
}
