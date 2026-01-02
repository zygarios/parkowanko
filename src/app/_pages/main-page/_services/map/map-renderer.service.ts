import { Injectable } from '@angular/core';
import { circle, distance, point } from '@turf/turf';
import type { FeatureCollection, LineString } from 'geojson';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../_types/location-coords.type';
import { ParkingPoint } from '../../../../_types/parking-point.type';
import { mapConfigData } from '../../_data/map-config-data';
import {
  PARKING_EDIT_AREA_SOURCE,
  PARKING_POI_LINE_SOURCE,
  PARKING_POI_RADIUS_SOURCE,
  PARKING_POI_SOURCE,
  TARGET_LOCATION_SOURCE,
} from './map-layers.service';

@Injectable()
export class MapRendererService {
  /**
   * Renderuje zielony obszar dozwolonej edycji (100m)
   * @param map - Instancja mapy
   * @param coords - Współrzędne środka obszaru
   */
  renderEditArea(map: maplibregl.Map, coords?: LocationCoords) {
    const editAreaSource = map.getSource(PARKING_EDIT_AREA_SOURCE) as maplibregl.GeoJSONSource;
    if (!editAreaSource) return;

    if (!coords) {
      editAreaSource.setData({
        type: 'FeatureCollection',
        features: [],
      });
      return;
    }

    const circleFeature = circle(
      [coords.lng, coords.lat],
      mapConfigData.MAX_DISTANCE_TO_EDIT_LOCATION_METERS,
      {
        steps: 64,
        units: 'meters',
      },
    );

    editAreaSource.setData({
      type: 'FeatureCollection',
      features: [circleFeature],
    });
  }
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
  renderRadiiForPois(
    map: maplibregl.Map,
    coordsList: LocationCoords[],
    collidingCoords?: LocationCoords,
  ) {
    const parkingPoiRadiusSource = map.getSource(
      PARKING_POI_RADIUS_SOURCE,
    ) as maplibregl.GeoJSONSource;
    if (!parkingPoiRadiusSource) return;

    parkingPoiRadiusSource.setData({
      type: 'FeatureCollection',
      features: coordsList.map((coords) => {
        const isColliding =
          collidingCoords &&
          coords.lat === collidingCoords.lat &&
          coords.lng === collidingCoords.lng;

        const circleFeature = circle(
          [coords.lng, coords.lat],
          mapConfigData.PARKING_POI_RADIUS_BOUND,
          {
            steps: 64,
            units: 'meters',
          },
        );

        circleFeature.properties = {
          ...circleFeature.properties,
          isColliding,
        };

        return circleFeature;
      }),
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
      isColliding?: boolean;
    },
  ) {
    const lineSource = map.getSource(PARKING_POI_LINE_SOURCE) as maplibregl.GeoJSONSource;
    if (!lineSource) return;

    lineSource.setData(
      this.getLineGeoJson(locations?.fixedCoords, locations?.targetCoords, locations?.isColliding),
    );
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
  getLineGeoJson(
    fixedCoords?: LocationCoords,
    targetCoords?: LocationCoords,
    isColliding: boolean = false,
  ): FeatureCollection<LineString> {
    // Early return jeśli brak współrzędnych - nie tworzymy pustych features
    if (!fixedCoords || !targetCoords) {
      return {
        type: 'FeatureCollection' as const,
        features: [],
      };
    }

    const coordinates = [
      [fixedCoords.lng, fixedCoords.lat],
      [targetCoords.lng, targetCoords.lat],
    ];

    // Oblicz dystans w metrach używając Turf.js
    const from = point([fixedCoords.lng, fixedCoords.lat]);
    const to = point([targetCoords.lng, targetCoords.lat]);
    const distanceInMeters = Math.round(distance(from, to, { units: 'meters' }));

    const lineGeoJson: FeatureCollection<LineString> = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates,
          },
          properties: {
            distance: distanceInMeters, // Dystans w metrach dla label
            isColliding,
          },
        },
      ],
    };
    return lineGeoJson;
  }
}
