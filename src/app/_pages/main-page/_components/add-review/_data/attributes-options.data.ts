import { ValueLabelType } from '../../../../../_types/value-label-type.model';
import { Attribute } from '../_types/attribute.model';

export const attributesOptionsData: ValueLabelType<Attribute>[] = [
  {
    value: Attribute.FREE_OFF_SEASON,
    label: 'Darmowe tylko poza sezonem',
  },
  {
    value: Attribute.PARKING_RESTRICTIONS,
    label: 'Ryzyko mandatów lub kontroli',
  },
  {
    value: Attribute.DANGEROUS_AREA,
    label: 'Niebezpieczna okolica',
  },
  {
    value: Attribute.POOR_SURFACE,
    label: 'Dziurawa nawierzchnia',
  },
  {
    value: Attribute.HARD_ACCESS,
    label: 'Trudny dojazd',
  },
  {
    value: Attribute.FLOOD_PRONE,
    label: 'Zalewane po ulewach',
  },
  {
    value: Attribute.POOR_LIGHTING,
    label: 'Słabo oświetlone',
  },
];
