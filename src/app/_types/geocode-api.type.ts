import { LocationCoords } from './location-coords.type';

export const geocodeUselessClasses = ['hydrografia', 'pokrycie terenu', 'miejscowość'];

export interface GeocodeFeatureResponse {
  features: {
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
      KLASA: string;
    };
  }[];
}

export interface GeocodeFeature {
  coords: LocationCoords;
  details: {
    name: string;
    desc: string;
    woj_nazwa?: string;
    pow_nazwa?: string;
    gm_nazwa?: string;
    miejsc_nazwa?: string;
    ul_nazwa_glowna?: string;
    pkt_numer?: string;
    pkt_kodPocztowy?: string;
  };
}
