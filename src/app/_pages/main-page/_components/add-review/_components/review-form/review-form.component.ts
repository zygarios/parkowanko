import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Field, FieldTree } from '@angular/forms/signals';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { ReviewSaveData } from '../../../../../../_types/review.type';
import { attributesOptionsData } from '../../_data/attributes-options.data';
import { occupancyOptionsData } from '../../_data/occupancy-options.data';

@Component({
  selector: 'app-review-form',
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    MatSelectTrigger,
    MatOption,
    Field,
    MatError,
    MatIcon,
    MatInputModule,
  ],
  templateUrl: './review-form.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewFormComponent {
  reviewForm = input.required<FieldTree<ReviewSaveData, string | number>>();

  readonly occupancyOptions = occupancyOptionsData;
  readonly attributesOptions = attributesOptionsData;

  attributeFormFieldLabel = computed(() => {
    const attributesValue = this.reviewForm().attributes().value();
    let labelPart = 'cech';

    if (attributesValue.length === 1) {
      return this.attributesOptions.find((type) => type.value === attributesValue[0])?.label;
    } else if (attributesValue.length >= 2 && attributesValue.length <= 4) {
      labelPart += 'y';
    }

    return `Wybrano ${attributesValue.length} ${labelPart}`;
  });
}
