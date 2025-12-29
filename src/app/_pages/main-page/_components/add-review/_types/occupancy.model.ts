export enum Occupancy {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  NO_SPACE = 'NO_SPACE',
  NO_DATA = 'NO_DATA',
}

export const OccupancyLabel = {
  [Occupancy.LOW]: 'Niskie',
  [Occupancy.MEDIUM]: 'Średnie',
  [Occupancy.HIGH]: 'Wysokie',
  [Occupancy.NO_SPACE]: 'Brak miejsc',
  [Occupancy.NO_DATA]: 'Brak informacji',
};
