import { ValueLabelType } from '../../../../../_types/value-label-type.type';
import { Attribute, AttributeLabel } from '../_types/attribute.model';

export const attributesOptionsData: ValueLabelType<Attribute>[] = [
  {
    value: Attribute.FREE_OFF_SEASON,
    label: AttributeLabel.FREE_OFF_SEASON,
  },
  {
    value: Attribute.PARKING_RESTRICTIONS,
    label: AttributeLabel.PARKING_RESTRICTIONS,
  },
  {
    value: Attribute.DANGEROUS_AREA,
    label: AttributeLabel.DANGEROUS_AREA,
  },
  {
    value: Attribute.POOR_SURFACE,
    label: AttributeLabel.POOR_SURFACE,
  },
  {
    value: Attribute.HARD_ACCESS,
    label: AttributeLabel.HARD_ACCESS,
  },
  {
    value: Attribute.FLOOD_PRONE,
    label: AttributeLabel.FLOOD_PRONE,
  },
  {
    value: Attribute.POOR_LIGHTING,
    label: AttributeLabel.POOR_LIGHTING,
  },
];
