import { Component } from '@angular/core';

@Component({
  selector: 'app-test-inline',
  template: `
    <div>asd</div>
    <p>
      @if (1) {
        test-inlines works!
      }
    </p>
    <article>asd</article>
  `,
  styles: `
    p {
      border: 1px solid red;
    }
  `,
  imports: [],
})
export class TestInlineComponent {}
