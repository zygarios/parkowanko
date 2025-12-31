import { Injectable } from '@angular/core';
import { circle, distance, point } from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../_types/location-coords.type';
import { ParkingPoint } from '../../../../_types/parking-point.type';
import { mapConfigData } from '../../_data/map-config-data';
import {
  PARKING_POI_LINE_SOURCE,
  PARKING_POI_RADIUS_SOURCE,
  PARKING_POI_SOURCE,
  TARGET_LOCATION_SOURCE,
} from './map-layers.service';

@Injectable()
export class MapRendererService {
  /**
   * Renderuje POI parkingów jako punkty GeoJSON z klastrowaniem
   * Parking jest serializowany do JSON w properties dla późniejszego odczytu przy kliknięciu
   * @param map - Instancja mapy
   * @param parkingsList - Lista parkingów do wyświetlenia
   */
  renderPois(map: maplibregl.Map, parkingsList: ParkingPoint[]) {
    const parkingPoiSource = map.getSource(PARKING_POI_SOURCE) as maplibregl.GeoJSONSource;
    if (!parkingPoiSource) return;

    parkingPoiSource.setData({
      type: 'FeatureCollection',
      features: parkingsList.map((parking) => {
        const copiedParking = structuredClone(parking);
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parking.location.lng, parking.location.lat],
          },
          properties: {
            parking: copiedParking,
            score: parking.likeCount - parking.dislikeCount,
            scoreLabel:
              parking.likeCount - parking.dislikeCount > 0
                ? `+${parking.likeCount - parking.dislikeCount}`
                : `${parking.likeCount - parking.dislikeCount}`,
            isVerified: parking.isVerified,
          },
        };
      }),
    });
  }

  /**
   * Renderuje promienie wokół punktów parkingów
   * Używane do wizualizacji zasięgu przy dodawaniu nowego parkingu dla wszystkich widocznych punktów
   * @param map - Instancja mapy
   * @param coordsList - Lista współrzędnych centrów promieni
   */
  renderRadiiForPois(map: maplibregl.Map, coordsList: LocationCoords[]) {
    const parkingPoiRadiusSource = map.getSource(
      PARKING_POI_RADIUS_SOURCE,
    ) as maplibregl.GeoJSONSource;
    if (!parkingPoiRadiusSource) return;

    parkingPoiRadiusSource.setData({
      type: 'FeatureCollection',
      features: coordsList.map((coords) =>
        circle([coords.lng, coords.lat], mapConfigData.PARKING_POI_RADIUS_BOUND, {
          steps: 64,
          units: 'meters',
        }),
      ),
    });
  }

  /**
   * Renderuje linię między dwoma punktami na mapie
   * Używane do pokazania odległości od wybranego parkingu do nowej lokalizacji
   * @param map - Instancja mapy
   * @param locations - Opcjonalne współrzędne początku i końca linii
   */
  renderLineBetweenPoints(
    map: maplibregl.Map,
    locations?: {
      fixedCoords?: LocationCoords;
      targetCoords?: LocationCoords;
    },
  ) {
    const lineSource = map.getSource(PARKING_POI_LINE_SOURCE) as maplibregl.GeoJSONSource;
    if (!lineSource) return;

    lineSource.setData(this.getLineGeoJson(locations?.fixedCoords, locations?.targetCoords));
  }

  /**
   * Renderuje ikonę celu w określonym punkcie
   * @param map - Instancja mapy
   * @param coords - Współrzędne celu (opcjonalne - null usuwa ikonę)
   */
  renderTargetLocationPoi(map: maplibregl.Map, coords?: LocationCoords) {
    const targetSource = map.getSource(TARGET_LOCATION_SOURCE) as maplibregl.GeoJSONSource;
    if (!targetSource) return;

    targetSource.setData({
      type: 'FeatureCollection',
      features: coords
        ? [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [coords.lng, coords.lat],
              },
              properties: {},
            },
          ]
        : [],
    });
  }

  /**
   * Tworzy GeoJSON dla LineString między dwoma punktami
   * Oblicza dystans i dodaje go jako property dla wyświetlenia labela
   * @param fixedCoords - Punkt początkowy linii
   * @param targetCoords - Punkt końcowy linii
   * @returns GeoJSON FeatureCollection z linią i dystansem lub pustą kolekcją
   */
  getLineGeoJson(fixedCoords?: LocationCoords, targetCoords?: LocationCoords): any {
    let coordinates: any = [];
    let distanceInMeters = 0;

    // Utwórz linię tylko jeśli podano oba punkty
    if (fixedCoords && targetCoords) {
      coordinates = [
        [fixedCoords.lng, fixedCoords.lat],
        [targetCoords.lng, targetCoords.lat],
      ];

      // Oblicz dystans w metrach używając Turf.js
      const from = point([fixedCoords.lng, fixedCoords.lat]);
      const to = point([targetCoords.lng, targetCoords.lat]);
      distanceInMeters = Math.round(distance(from, to, { units: 'meters' }));
    }

    const lineGeoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {
            distance: distanceInMeters, // Dystans w metrach dla label
          },
        },
      ],
    };
    return lineGeoJson;
  }
}
