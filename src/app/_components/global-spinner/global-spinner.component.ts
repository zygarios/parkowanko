import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-global-spinner',
  styles: `
    .lds-ring div {
      border: 8px solid var(--par-color-primary);
      animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      border-color: var(--par-color-primary) transparent transparent transparent;
    }
    .lds-ring div:nth-child(1) {
      animation-delay: -0.45s;
    }
    .lds-ring div:nth-child(2) {
      animation-delay: -0.3s;
    }
    .lds-ring div:nth-child(3) {
      animation-delay: -0.15s;
    }
    @keyframes lds-ring {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `,
  template: `
    <div class="lds-ring inline-block relative w-20 h-20 text-(--par-color-primary)">
      <div class="box-border w-16 h-16 m-2 absolute block rounded-full"></div>
      <div class="box-border w-16 h-16 m-2 absolute block rounded-full"></div>
      <div class="box-border w-16 h-16 m-2 absolute block rounded-full"></div>
      <div class="box-border w-16 h-16 m-2 absolute block rounded-full"></div>
    </div>
    @if (message()) {
      <div
        class="text-(--par-color-primary) rounded-2xl bg-(--mat-sys-surface) px-6 py-3 shadow-lg border-3! border-(--par-color-primary)"
      >
        {{ message() }}
      </div>
    }
  `,
  host: {
    class:
      'flex flex-col gap-[50px] justify-center items-center w-full h-full bg-[color-mix(in_srgb,var(--par-color-primary)_10%,transparent)]',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSpinnerComponent {
  message = input<string>('');
}
