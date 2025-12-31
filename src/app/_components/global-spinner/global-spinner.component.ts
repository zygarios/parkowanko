import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-global-spinner',
  imports: [MatProgressSpinnerModule],
  template: `
    <mat-spinner />
    @if (message()) {
      <div class="text-(--par-color-primary) rounded-2xl bg-white px-6 py-3 shadow-lg">
        {{ message() }}
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 50px;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: color-mix(in srgb, var(--par-color-primary) 10%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSpinnerComponent {
  message = input<string>('');
}
