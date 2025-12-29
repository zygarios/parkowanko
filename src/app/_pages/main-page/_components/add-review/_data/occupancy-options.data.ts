import { ValueLabelType } from '../../../../../_types/value-label-type.type';
import { Occupancy, OccupancyLabel } from '../_types/occupancy.model';

export const occupancyOptionsData: ValueLabelType<Occupancy>[] = [
  { value: Occupancy.LOW, label: OccupancyLabel.LOW, icon: 'network_wifi_1_bar' },
  { value: Occupancy.MEDIUM, label: OccupancyLabel.MEDIUM, icon: 'network_wifi_2_bar' },
  { value: Occupancy.HIGH, label: OccupancyLabel.HIGH, icon: 'network_wifi_3_bar' },
  {
    value: Occupancy.NO_SPACE,
    label: OccupancyLabel.NO_SPACE,
    icon: 'signal_wifi_statusbar_connected_no_internet_4',
  },
  { value: Occupancy.NO_DATA, label: OccupancyLabel.NO_DATA },
];
