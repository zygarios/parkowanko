import { LocationCoords } from './location-coords.type';

export interface GeocodeResponse {
  features: GeocodeFeatureResponse[];
}
export interface GeocodeFeatureResponse {
  geometry: {
    coordinates: [number, number] | [[number, number]];
    type: string;
  };
  _search: { name: string; desc: string };
  properties: {
    woj_nazwa?: string;
    pow_nazwa?: string;
    gm_nazwa?: string;
    miejsc_nazwa?: string;
    ul_nazwa_glowna?: string;
    pkt_numer?: string;
    pkt_kodPocztowy?: string;
    KLASA?: string;
    RODZAJ?: string;
  };
}

export interface GeocodeFeature {
  coords: LocationCoords;
  details: {
    name: string;
    desc: string;
    subname: string | null;
    woj_nazwa?: string;
    pow_nazwa?: string;
    gm_nazwa?: string;
    miejsc_nazwa?: string;
    ul_nazwa_glowna?: string;
    pkt_numer?: string;
    pkt_kodPocztowy?: string;
  };
}
