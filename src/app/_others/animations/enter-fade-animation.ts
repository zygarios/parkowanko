import { animate, style, transition, trigger } from '@angular/animations';

export const enterFadeAnimation = trigger('enterFadeAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms', style({ opacity: 1 })),
  ]),
]);
