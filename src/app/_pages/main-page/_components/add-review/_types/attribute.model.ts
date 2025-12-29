export enum Attribute {
  FREE_OFF_SEASON = 'FREE_OFF_SEASON',
  DANGEROUS_AREA = 'DANGEROUS_AREA',
  POOR_SURFACE = 'POOR_SURFACE',
  HARD_ACCESS = 'HARD_ACCESS',
  FLOOD_PRONE = 'FLOOD_PRONE',
  POOR_LIGHTING = 'POOR_LIGHTING',
  PARKING_RESTRICTIONS = 'PARKING_RESTRICTIONS',
}

export const AttributeLabel = {
  [Attribute.FREE_OFF_SEASON]: 'Darmowe tylko poza sezonem',
  [Attribute.DANGEROUS_AREA]: 'Niebezpieczna okolica',
  [Attribute.POOR_SURFACE]: 'Dziurawa nawierzchnia',
  [Attribute.HARD_ACCESS]: 'Trudny dojazd',
  [Attribute.FLOOD_PRONE]: 'Zalewane po ulewach',
  [Attribute.POOR_LIGHTING]: 'Słabo oświetlone',
  [Attribute.PARKING_RESTRICTIONS]: 'Ryzyko mandatów lub kontroli',
};
