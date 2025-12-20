import { inject, Injectable } from '@angular/core';
import { circle, distance, point } from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../../_types/location-coords.type';
import { ParkingPoint } from '../../../../../_types/parking-point.type';
import {
  MapLayersService,
  PARKING_POI_LINE_SOURCE,
  PARKING_POI_RADIUS_SOURCE,
  PARKING_POI_SOURCE,
  TARGET_LOCATION_SOURCE,
} from './map-layers.service';
import { PARKING_POI_RADIUS_BOUND, POLAND_BOUNDS, POLAND_MAX_BOUNDS } from './map.service';

@Injectable({ providedIn: 'root' })
export class MapRendererService {
  private _mapLayersService = inject(MapLayersService);

  /**
   * Inicjalizuje i renderuje mapę MapLibre GL
   * Konfiguruje granice Polski, style OSM oraz kontrolki nawigacji i geolokalizacji
   * @returns Promise z instancją mapy MapLibre
   * @throws Error jeśli nie uda się załadować stylu lub ikony
   */
  async initRenderMap(): Promise<maplibregl.Map> {
    try {
      // Załaduj styl mapy OSM z pliku JSON
      const style = await import('../../../../../../../public/osm_bright.json');

      // Utwórz instancję mapy z konfiguracją dla Polski
      const mapRef = new maplibregl.Map({
        container: 'map',
        maxBounds: POLAND_MAX_BOUNDS, // Ograniczenie przesuwania poza Polskę (+3° margines)
        bounds: POLAND_BOUNDS, // Początkowy widok: cała Polska
        style: style as any,
      })
        .addControl(new maplibregl.NavigationControl({ showCompass: false }))
        .addControl(
          new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            showAccuracyCircle: false,
            trackUserLocation: true,
            fitBoundsOptions: { maxZoom: 17 }, // Max zoom przy geolokalizacji
          }),
        );

      // Wyłącz rotację mapy gestem dotykowym
      mapRef.touchZoomRotate.disableRotation();

      const icons = [
        { name: 'parking-free-poi', url: 'icons/parking-free-poi.svg' },
        { name: 'parking-free-unverified-poi', url: 'icons/parking-free-unverified-poi.svg' },
        { name: 'target-location', url: 'icons/target-location.svg' },
      ];

      await Promise.all(icons.map((i) => this.loadMapImage(mapRef, i.name, i.url)));

      return mapRef;
    } catch (error) {
      console.error('Failed to initialize MapLibre map:', error);
      throw error; // Propaguj błąd do wywołującego
    }
  }

  async loadMapImage(map: maplibregl.Map, name: string, url: string, size = 128): Promise<void> {
    try {
      const image = new Image(size, size);
      image.src = url;
      await image.decode();
      map.addImage(name, image);
    } catch (error) {
      console.error(`Failed to load image "${name}" from ${url}`, error);
    }
  }

  /**
   * Przygotowuje marker DOM do używania na mapie
   * Marker ma klasę CSS 'marker' ze stylem parkingu
   * @returns Instancja maplibregl.Marker z możliwością przeciągania
   */
  prepareMarker(): maplibregl.Marker {
    const el = document.createElement('img');
    el.className = 'marker';
    el.src = 'icons/parking-marker.svg';
    el.loading = 'lazy';

    return new maplibregl.Marker({
      element: el,
      draggable: true,
    });
  }

  /**
   * Przygotowuje wszystkie warstwy do renderowania na mapie
   * Inicjalizuje puste źródła danych dla: POI z klastrowaniem, promieni i linii
   * @param map - Instancja mapy MapLibre
   */
  prepareLayersForRender(map: maplibregl.Map): void {
    this._mapLayersService.prepareLayersForPoisWithClusters(map);
    this._mapLayersService.prepareLayersForPoisRadius(map);
    this._mapLayersService.prepareLayersForPoiLines(map, this._getLineGeoJson());
    this._mapLayersService.prepareLayersForTargetLocation(map);
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
   * Renderuje promień wokół punktu parkingu
   * Używane do wizualizacji zasięgu przy dodawaniu nowego parkingu
   * @param map - Instancja mapy
   * @param markerCoords - Współrzędne centrum promienia (opcjonalne)
   */
  renderRadiusForParkingPoi(map: maplibregl.Map, markerCoords?: LocationCoords) {
    const parkingPoiRadiusSource = map.getSource(
      PARKING_POI_RADIUS_SOURCE,
    ) as maplibregl.GeoJSONSource;
    if (!parkingPoiRadiusSource) return;

    // Renderuj okrąg tylko jeśli podano współrzędne
    parkingPoiRadiusSource.setData({
      type: 'FeatureCollection',
      features: markerCoords
        ? [
            circle([markerCoords.lng, markerCoords.lat], PARKING_POI_RADIUS_BOUND, {
              steps: 64, // Gładki okrąg (więcej kroków = bardziej okrągły)
              units: 'meters',
            }),
          ]
        : [], // Pusta lista = usuń promień
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

    lineSource.setData(this._getLineGeoJson(locations?.fixedCoords, locations?.targetCoords));
  }

  /**
   * Renderuje ikonę celu w określonym punkcie
   * @param map - Instancja mapy
   * @param coords - Współrzędne celu (opcjonalne - null usuwa ikonę)
   */
  renderTargetLocation(map: maplibregl.Map, coords?: LocationCoords) {
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
  private _getLineGeoJson(fixedCoords?: LocationCoords, targetCoords?: LocationCoords): any {
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
