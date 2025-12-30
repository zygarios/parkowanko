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
        showAccuracyCircle: false,
        trackUserLocation: false, // Tylko jednorazowe centrowanie, bez śledzenia kamery
        fitBoundsOptions: { maxZoom: 17, animate: false },
      });

      // Utwórz instancję mapy z konfiguracją dla Polski
      const mapRef = new maplibregl.Map({
        container: 'map',
        maxBounds: mapConfigData.POLAND_MAX_BOUNDS, // Ograniczenie przesuwania poza Polskę (+3° margines)
        bounds: mapConfigData.POLAND_BOUNDS, // Początkowy widok: cała Polska
        style: style as any,
      })
        .addControl(new maplibregl.NavigationControl({ showCompass: false }))
        .addControl(geolocate);

      // Wyłącz rotację mapy gestem dotykowym
      mapRef.touchZoomRotate.disableRotation();

      const icons = [
        { name: 'parking-free-poi', url: 'icons/parking-free-poi.svg' },
        { name: 'parking-free-unverified-poi', url: 'icons/parking-free-unverified-poi.svg' },
        { name: 'target-location', url: 'icons/target-location.svg' },
      ];

      await Promise.all(icons.map((i) => this.loadMapImage(mapRef, i.name, i.url)));

      mapRef.on('load', () => {
        geolocate.trigger();
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
      const image = new Image(size, size);
      image.src = url;
      await image.decode();
      map.addImage(name, image);
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
  }
}
