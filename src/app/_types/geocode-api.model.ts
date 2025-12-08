export interface GeocodeResponse {
  type: string;
  foundObjects: number;
  results: Record<string, Localization>;
}

export type Localization = GeocodeCity | GeocodeAddress;

export enum LocalizationType {
  CITY = 'CITY',
  ADDRESS = 'ADDRESS',
}
interface GeocodeCity {
  city: string;
  voivodeship: string;
  // powiat
  county: string;
  // gmina
  commune: string;
  // pełna lokalizacja "{Państwo, województwo, powiat, gmina}"
  jednostka: string;
  // lat
  y: string;
  // lng
  x: string;
  teryt: string;
  type: LocalizationType;
}
interface GeocodeAddress {
  city: string;
  street: string;
  // numer budynku
  number: string;
  // kod pocztowy
  code: string;

  // lng
  x: string;
  // lat
  y: string;
  // pełna lokalizacja "{Państwo, województwo, powiat, gmina}"
  jednostka: string;
  teryt: string;
  type: LocalizationType;
}
