import { inject, Injectable } from '@angular/core';
import maplibregl from 'maplibre-gl';
import { mapConfigData } from '../../_data/map-config-data';
import { MapLayersService } from './map-layers.service';
import { MapRendererService } from './map-renderer.service';

@Injectable()
export class MapInitializerService {
  private _mapRendererService = inject(MapRendererService);
  private _mapLayersService = inject(MapLayersService);

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
   * Inicjalizuje i renderuje mapę MapLibre GL
   * Konfiguruje granice Polski, style OSM oraz kontrolki nawigacji i geolokalizacji
   * @returns Promise z obiektem zawierającym instancję mapy i kontrolkę geolokalizacji
   * @throws Error jeśli nie uda się załadować stylu lub ikony
   */
  async initRenderMap(): Promise<{ map: maplibregl.Map }> {
    try {
      // Załaduj styl mapy OSM z pliku JSON
      const style = await import('../../../../../../public/osm_bright.json');

      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        showAccuracyCircle: true,
        trackUserLocation: true,
        showUserLocation: true,
        fitBoundsOptions: { maxZoom: 17, animate: false },
      });

      // Utwórz instancję mapy z konfiguracją dla Polski
      const mapRef = new maplibregl.Map({
        container: 'map',
        maxBounds: mapConfigData.POLAND_MAX_BOUNDS, // Ograniczenie przesuwania poza Polskę (+3° margines)
        bounds: mapConfigData.POLAND_BOUNDS, // Początkowy widok: cała Polska
        style: style as any,
      }).addControl(geolocate);

      // Przywróć zapisaną pozycję mapy
      const savedCenter = localStorage.getItem(mapConfigData.MAP_LAST_CENTER_KEY);
      const savedZoom = localStorage.getItem(mapConfigData.MAP_LAST_ZOOM_KEY);

      if (savedCenter && savedZoom) {
        mapRef.setZoom(parseFloat(savedZoom));
        mapRef.setCenter(JSON.parse(savedCenter));
      }

      // Wyłącz rotację mapy gestem dotykowym
      mapRef.touchZoomRotate.disableRotation();

      const icons = [
        { name: 'parking-free-poi', url: 'icons/parking-free-poi.svg' },
        { name: 'target-location', url: 'icons/target-location.svg' },
      ];

      await Promise.all(icons.map((i) => this.loadMapImage(mapRef, i.name, i.url)));

      mapRef.on('load', () => {
        this.prepareLayersForRender(mapRef);
      });

      return { map: mapRef };
    } catch (error) {
      console.error('Failed to initialize MapLibre map:', error);
      throw error; // Propaguj błąd do wywołującego
    }
  }

  private async loadMapImage(
    map: maplibregl.Map,
    name: string,
    url: string,
    size = 128,
  ): Promise<void> {
    try {
      const image = new Image();
      image.src = url;
      await image.decode();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const ratio = image.width / image.height;
      if (ratio > 1) {
        // Obraz szeroki
        canvas.width = size;
        canvas.height = size / ratio;
      } else {
        // Obraz wysoki lub kwadrat
        canvas.width = size * ratio;
        canvas.height = size;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      map.addImage(name, imageData);
    } catch (error) {
      console.error(`Failed to load image "${name}" from ${url}`, error);
    }
  }

  /**
   * Przygotowuje wszystkie warstwy do renderowania na mapie
   * Inicjalizuje puste źródła danych dla: POI z klastrowaniem, promieni i linii
   * @param map - Instancja mapy MapLibre
   */
  private prepareLayersForRender(map: maplibregl.Map): void {
    this._mapLayersService.prepareLayersForPoisWithClusters(map);
    this._mapLayersService.prepareLayersForPoisRadius(map);
    this._mapLayersService.prepareLayersForPoiLines(map, this._mapRendererService.getLineGeoJson());
    this._mapLayersService.prepareLayersForTargetLocation(map);
    this._mapLayersService.prepareLayersForEditArea(map);
  }
}
