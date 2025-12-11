import { Injectable } from '@angular/core';
import { environment } from '../../../../../../environments/environment.development';

export const PARKING_POI_SOURCE = 'parkingPoiSource';
export const PARKING_POI_RADIUS_SOURCE = 'parkingMarkerRadiusSource';
export const PARKING_POI_LINE_SOURCE = 'parkingPoiLineSource';

@Injectable({ providedIn: 'root' })
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
        'icon-image': 'parking-poi-icon', // Użyj załadowanej ikony parking-free-poi.png
        'icon-size': 0.3, // Skalowanie ikony (30% oryginalnego rozmiaru)
      },
    });

    // Warstwa dla klastrów (okręgi z gradacją rozmiaru)
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: PARKING_POI_SOURCE,
      filter: ['has', 'point_count'], // Pokaż tylko jeśli MA point_count (jest klastrem)
      paint: {
        'circle-color': environment.primaryColor,
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

    const MIN_ZOOM_TO_SHOW_RADIUS = 15; // Promień widoczny dopiero przy bliskim zoomie

    // Warstwa wypełnienia promienia (czerwony, półprzezroczysty)
    map.addLayer({
      id: 'location-radius',
      type: 'fill',
      source: PARKING_POI_RADIUS_SOURCE,
      minzoom: MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'fill-color': '#FF0000',
        'fill-opacity': 0.15, // Delikatne wypełnienie dla lepszej czytelności
      },
    });

    // Warstwa obrysu promienia (czerwona linia)
    map.addLayer({
      id: 'location-radius-outline',
      type: 'line',
      source: PARKING_POI_RADIUS_SOURCE,
      minzoom: MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'line-color': '#FF0000',
        'line-width': 1,
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
        'line-color': environment.primaryColor,
        'line-width': 3,
        'line-dasharray': [2, 2], // Przerywana: 2px linia, 2px przerwa
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
        'text-halo-color': environment.primaryColor,
        'text-halo-width': 1,
        'text-opacity-transition': { duration: 0 },
        'text-translate-transition': { duration: 0 },
      },
    });
  }
}
