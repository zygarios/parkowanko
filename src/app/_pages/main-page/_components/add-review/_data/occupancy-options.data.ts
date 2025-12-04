import { ValueLabelType } from '../../../../../_types/value-label-type.model';
import { Occupancy } from '../_types/occupancy.model';

export const occupancyOptionsData: ValueLabelType<Occupancy>[] = [
  { value: Occupancy.LOW, label: 'Niskie', icon: 'network_wifi_1_bar' },
  { value: Occupancy.MEDIUM, label: 'Średnie', icon: 'network_wifi_2_bar' },
  { value: Occupancy.HIGH, label: 'Wysokie', icon: 'network_wifi_3_bar' },
  {
    value: Occupancy.NO_SPACE,
    label: 'Brak miejsc',
    icon: 'signal_wifi_statusbar_connected_no_internet_4',
  },
  { value: Occupancy.NO_DATA, label: 'Nie mam zdania' },
];
