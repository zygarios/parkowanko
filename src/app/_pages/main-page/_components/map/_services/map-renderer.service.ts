import { inject, Injectable } from '@angular/core';
import { circle, distance, point } from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../../_types/location-coords.model';
import { Parking } from '../../../../../_types/parking.model';
import {
  MapLayersService,
  PARKING_POI_LINE_SOURCE,
  PARKING_POI_RADIUS_SOURCE,
  PARKING_POI_SOURCE,
} from './map-layers.service';
import { POLAND_BOUNDS, POLAND_MAX_BOUNDS } from './map.service';

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

      // Załaduj ikonę POI parkingu
      const imageUrl = '/icons/parking-free-poi.png';
      try {
        const imageBitmap = await fetch(imageUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch parking icon: ${response.statusText}`);
            }
            return response.blob();
          })
          .then((blob) => createImageBitmap(blob));

        mapRef.addImage('parking-poi-icon', imageBitmap);
      } catch (error) {
        console.error('Failed to load parking POI icon:', error);
        // Mapa może działać bez ikony, błąd jest zalogowany
      }

      return mapRef;
    } catch (error) {
      console.error('Failed to initialize MapLibre map:', error);
      throw error; // Propaguj błąd do wywołującego
    }
  }

  /**
   * Przygotowuje marker DOM do używania na mapie
   * Marker ma klasę CSS 'marker' ze stylem parkingu
   * @returns Instancja maplibregl.Marker z możliwością przeciągania
   */
  prepareMarker(): maplibregl.Marker {
    const el = document.createElement('div');
    el.className = 'marker';

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
  }

  /**
   * Renderuje POI parkingów jako punkty GeoJSON z klastrowaniem
   * Parking jest serializowany do JSON w properties dla późniejszego odczytu przy kliknięciu
   * @param map - Instancja mapy
   * @param parkingsList - Lista parkingów do wyświetlenia
   */
  renderPois(map: maplibregl.Map, parkingsList: Parking[]) {
    const parkingPoiSource = map.getSource(PARKING_POI_SOURCE) as maplibregl.GeoJSONSource;

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
            parking: copiedParking, // Przechowaj cały obiekt parkingu dla event handlerów
          },
        };
      }),
    });
  }

  /**
   * Renderuje promień 20m wokół punktu parkingu
   * Używane do wizualizacji zasięgu przy dodawaniu nowego parkingu
   * @param map - Instancja mapy
   * @param markerCoords - Współrzędne centrum promienia (opcjonalne)
   */
  renderRadiusForParkingPoi(map: maplibregl.Map, markerCoords?: LocationCoords) {
    const parkingPoiRadiusSource = map.getSource(
      PARKING_POI_RADIUS_SOURCE,
    ) as maplibregl.GeoJSONSource;

    // Renderuj okrąg tylko jeśli podano współrzędne
    parkingPoiRadiusSource.setData({
      type: 'FeatureCollection',
      features: markerCoords
        ? [
            circle([markerCoords.lng, markerCoords.lat], 20, {
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
  renderLineForMarker(
    map: maplibregl.Map,
    locations?: {
      fixedCoords?: LocationCoords;
      targetCoords?: LocationCoords;
    },
  ) {
    const lineSource = map.getSource(PARKING_POI_LINE_SOURCE) as maplibregl.GeoJSONSource;
    lineSource.setData(this._getLineGeoJson(locations?.fixedCoords, locations?.targetCoords));
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
