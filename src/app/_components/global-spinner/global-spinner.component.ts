import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-global-spinner',
  standalone: true, // Zakładam, że używasz standalone (wersje 17+)
  imports: [MatProgressSpinnerModule],
  template: `
    <div
      class="bg-white/50 backdrop-blur-sm rounded-full py-4 px-8 shadow-2xl flex items-center justify-center border border-(--par-color-primary)/20 gap-4 max-w-[90%]"
    >
      <mat-spinner diameter="28" strokeWidth="3" />
      @if (message()) {
        <span class="text-base font-medium text-gray-800 text-center">
          {{ message() }}
        </span>
      }
    </div>
  `,
  host: {
    class: 'fixed inset-0 z-[9999] flex flex-col justify-center items-center pointer-events-none',
    // TODO zdjac sztywne true
    '[class.bg-white/50]': 'hasBackdrop()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSpinnerComponent {
  message = input<string>('');
  hasBackdrop = input<boolean>(false);
}
