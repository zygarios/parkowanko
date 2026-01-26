import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { mapConfigData } from '../../_data/map-config-data';

export const PARKING_POI_SOURCE = 'parkingPoiSource';
export const PARKING_POI_RADIUS_SOURCE = 'parkingMarkerRadiusSource';
export const PARKING_POI_LINE_SOURCE = 'parkingPoiLineSource';
export const PARKING_EDIT_AREA_SOURCE = 'parkingEditAreaSource';
export const TARGET_LOCATION_SOURCE = 'targetLocationSource';

@Injectable()
export class MapLayersService {
  /**
   * Przygotowuje warstwy dla wyświetlania POI parkingów z klastrowaniem
   * Tworzy 3 warstwy:
   * 1. unclustered-point - pojedyncze POI poza klastrami (symbol/ikona)
   * 2. clusters - zgrupowane POI gdy są blisko siebie (okłegi)
   * 3. cluster-count - liczba POI w klastrze (tekst na okręgu)
   *
   * Klastrowanie włącza się automatycznie gdy punkty są w promieniu 50px
   * @param map - Instancja mapy MapLibre
   */
  async prepareLayersForPoisWithClusters(map: maplibregl.Map) {
    // Dodaj źródło danych GeoJSON z konfiguracją klastrowania
    map.addSource(PARKING_POI_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [], // Puste na start, wypełniane przez renderPois()
      },
      cluster: true, // Włącz grupowanie punktów
      clusterMaxZoom: 14, // Maksymalny zoom z klastrowaniem (po 14 pokazuj pojedyncze)
      clusterRadius: 50, // Promień grupowania w pikselach
    });

    // Warstwa dla pojedynczych POI (nie w klastrze)
    map.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: PARKING_POI_SOURCE,
      filter: ['!', ['has', 'point_count']], // Pokaż tylko jeśli NIE ma point_count (nie jest klastrem)
      layout: {
        'icon-image': 'parking-free-poi',
        'icon-size': 0.2,
        'icon-overlap': 'always',
        'text-field': [
          'case',
          ['==', ['get', 'score'], 0],
          '',
          ['to-string', ['get', 'scoreLabel']],
        ],
        'text-font': ['Open Sans Bold'],
        'text-offset': [1.2, -0.15],
        'text-anchor': 'top-left',
        'text-size': 12,
        'text-allow-overlap': true,
        'text-letter-spacing': 0,
      },
      paint: {
        'text-color': [
          'case',
          ['>', ['get', 'score'], 0],
          environment.colors.success,
          ['<', ['get', 'score'], 0],
          environment.colors.error,
          environment.colors.primary,
        ],
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1,
        'text-translate-transition': { duration: 0 },
      },
    });

    // Warstwa dla klastrów (okręgi z gradacją rozmiaru)
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: PARKING_POI_SOURCE,
      filter: ['has', 'point_count'], // Pokaż tylko jeśli MA point_count (jest klastrem)
      paint: {
        'circle-color': environment.colors.primary,
        // Rozmiar okręgu zależy od liczby POI:
        // <100 parkingów = 20px, 100-750 = 30px, >750 = 40px
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 2,
      },
    });

    // Warstwa dla liczby POI w klastrze (wyświetlana na środku okręgu)
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: PARKING_POI_SOURCE,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}', // Automatyczne skróty: 1000 -> 1k, 1500000 -> 1.5m
        'text-size': 16,
      },
      paint: {
        'text-color': '#FFFFFF',
      },
    });
  }

  /**
   * Przygotowuje warstwy dla wyświetlania promienia wokół punktu
   * Używane przy dodawaniu nowego parkingu - pokazuje zasięg 20m
   * Promień widoczny tylko przy zoomie >= 15 (bliskie przybliżenie)
   * @param map - Instancja mapy MapLibre
   */
  prepareLayersForPoisRadius(map: maplibregl.Map) {
    // Dodaj źródło danych dla promienia
    map.addSource(PARKING_POI_RADIUS_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [], // Puste - wypełniane przez renderRadiusForParkingPoi()
      },
    });

    // Warstwa wypełnienia promienia (czerwony, półprzezroczysty)
    map.addLayer({
      id: 'location-radius',
      type: 'fill',
      source: PARKING_POI_RADIUS_SOURCE,
      minzoom: mapConfigData.MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['get', 'isColliding'], false],
          environment.colors.error,
          environment.colors.primary,
        ],
        'fill-opacity': 0.05, // Delikatne wypełnienie dla lepszej czytelności
      },
    });

    // Warstwa obrysu promienia (czerwona linia)
    map.addLayer({
      id: 'location-radius-outline',
      type: 'line',
      source: PARKING_POI_RADIUS_SOURCE,
      minzoom: mapConfigData.MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'line-color': [
          'case',
          ['boolean', ['get', 'isColliding'], false],
          environment.colors.error,
          environment.colors.primary,
        ],
        'line-width': 1,
        'line-opacity': 0.7,
      },
    });
  }

  /**
   * Przygotowuje warstwę dla rysowania linii między punktami
   * Używane do pokazania dystansu od wybranego parkingu do nowej lokalizacji
   * Linia jest przerywana w kolorze primaryColor + label z dystansem w metrach
   * @param map - Instancja mapy MapLibre
   * @param lineGeoJson - Początkowa geometria linii (zazwyczaj pusta)
   */
  prepareLayersForPoiLines(map: maplibregl.Map, lineGeoJson: any) {
    // Dodaj źródło danych dla linii
    map.addSource(PARKING_POI_LINE_SOURCE, {
      type: 'geojson',
      data: lineGeoJson, // Początkowa linia (pusta)
    });

    // Warstwa linii (przerywana, kolor primaryColor)
    map.addLayer({
      id: 'line-layer',
      type: 'line',
      source: PARKING_POI_LINE_SOURCE,
      paint: {
        'line-color': [
          'case',
          ['boolean', ['get', 'isColliding'], false],
          environment.colors.error,
          environment.colors.primary,
        ],
        'line-width': 3,
        'line-dasharray': [2, 2], // Przerywana: 2px linia, 2px przerwa
        'line-opacity': 0.8,
      },
    });

    // Warstwa tekstowa z dystansem (wyświetla się na środku linii)
    map.addLayer({
      id: 'line-distance-label',
      type: 'symbol',
      source: PARKING_POI_LINE_SOURCE,
      layout: {
        'symbol-placement': 'line-center',
        'text-field': '{distance} m',
        'text-size': 14,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-allow-overlap': true, // Pozwól na nakładanie się z innymi elementami
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': [
          'case',
          ['boolean', ['get', 'isColliding'], false],
          environment.colors.error,
          environment.colors.primary,
        ],
        'text-halo-width': 1,
        'text-opacity-transition': { duration: 0 },
        'text-translate-transition': { duration: 0 },
        'text-opacity': 0.8,
      },
    });
  }

  /**
   * Przygotowuje warstwę dla wybranego celu (np. adresu z wyszukiwarki)
   * Wyświetla ikonę location-target w wybranym punkcie
   * @param map - Instancja mapy MapLibre
   */
  prepareLayersForTargetLocation(map: maplibregl.Map) {
    map.addSource(TARGET_LOCATION_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addLayer({
      id: 'target-location-point',
      type: 'symbol',
      source: TARGET_LOCATION_SOURCE,
      layout: {
        'icon-image': 'target-location',
        'icon-size': 0.35,
        'icon-overlap': 'always',
      },
    });
  }

  /**
   * Przygotowuje warstwy dla obszaru edycji (maksymalny dystans 100m)
   * Pokazuje zielony promień wokół punktu startowego
   */
  prepareLayersForEditArea(map: maplibregl.Map) {
    map.addSource(PARKING_EDIT_AREA_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addLayer({
      id: 'edit-area-fill',
      type: 'fill',
      source: PARKING_EDIT_AREA_SOURCE,
      minzoom: mapConfigData.MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'fill-color': environment.colors.success,
        'fill-opacity': 0.05,
      },
    });

    map.addLayer({
      id: 'edit-area-outline',
      type: 'line',
      source: PARKING_EDIT_AREA_SOURCE,
      minzoom: mapConfigData.MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'line-color': environment.colors.success,
        'line-width': 1,
        'line-opacity': 0.5,
        'line-dasharray': [4, 4],
      },
    });
  }
}
