export interface GeocodeResponse<
  T extends GeocodeCity | GeocodeStreet | GeocodeAddress,
> {
  type: string;
  foundObjects: number;
  results: Record<string, T>;
}

export interface GeocodeCity {
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
}
export interface GeocodeStreet {
  city: string;
  street: string;
  // pełna lokalizacja "{Państwo, województwo, powiat, gmina}"
  jednostka: string;
  // lat
  y: string;
  // lng
  x: string;
  teryt: string;
}
export interface GeocodeAddress {
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
}
