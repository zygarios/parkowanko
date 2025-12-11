import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-global-spinner',
  imports: [MatProgressSpinnerModule],
  template: ` <mat-spinner /> `,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: color-mix(in srgb, var(--par-color-primary) 10%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSpinnerComponent {}
