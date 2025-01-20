import { Injectable, signal } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { Coords } from '../../_types/coords.model';
import { ParkingPoi } from '../../_types/parking-poi.mode';

const POLAND_BOUNDS = [14, 48, 24.5, 56] as any;
const POLAND_MAX_BOUNDS = [
  POLAND_BOUNDS[0] - 3,
  POLAND_BOUNDS[1] - 3,
  POLAND_BOUNDS[2] + 3,
  POLAND_BOUNDS[3] + 3,
] as maplibregl.LngLatBoundsLike;
const CLOSE_ZOOM = 16;

@Injectable({ providedIn: 'root' })
export class MapService {
  private _markerMoveListener: any;
  private _markerRef: maplibregl.Marker = new maplibregl.Marker({
    draggable: true,
  });

  private _map!: maplibregl.Map;

  selectedPoi = signal<null | ParkingPoi>(null);

  getMap(): maplibregl.Map {
    return this._map;
  }

  async initialRenderMap(): Promise<maplibregl.Map> {
    const style = await import('./osm_bright.json');

    this._map = new maplibregl.Map({
      container: 'map',
      maxBounds: POLAND_MAX_BOUNDS,
      bounds: POLAND_BOUNDS,
      style: style as any,
      // Additional free styles
      // style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      // style: 'https://tiles.openfreemap.org/styles/bright',
    })
      .addControl(new maplibregl.NavigationControl({ showCompass: false }))
      .addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          fitBoundsOptions: { maxZoom: 17 },
        }),
      );

    this._listenForPoiClick();

    return this._map;
  }

  renderPoiList(poiListCoords: ParkingPoi[]): void {
    const sourceId = 'parkings';
    let source = this._map.getSource(sourceId) as maplibregl.GeoJSONSource;

    if (!source) {
      source = this._preparePoiLayers(sourceId);
    }

    // Nadpisanie danych o punktach poi na mapie
    source.setData({
      type: 'FeatureCollection',
      features: poiListCoords.map((poiData) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [poiData.coords.lng, poiData.coords.lat],
        },
        properties: {
          poiData,
        },
      })),
    });
  }

  private _preparePoiLayers(sourceId: string): maplibregl.GeoJSONSource {
    // Ustawienie danych o punktach poi na mapie
    this._map.addSource('parkings', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Dodanie warstwy klastrów zbiorczych dla punktów
    this._map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#32abcd',
          100,
          '#84ca35',
          750,
          '#ca3584',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
      },
    });

    // Dodanie warsztwy liczb określających liczbę punktów POI w danym klastrze
    this._map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Roboto Regular'],
        'text-size': 16,
      },
    });

    // Dodanie warstwy pojedynczych punktów POI
    this._map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#fa3600',
        'circle-radius': 5,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
      },
    });

    return this._map.getSource(sourceId) as maplibregl.GeoJSONSource;
  }

  private _listenForPoiClick() {
    this._map.on('click', 'unclustered-point', (e: any) => {
      // solution for maplibre problem with serializing nested properties
      const stringifiedData = e.features?.[0]?.properties as {
        poiData: string;
      };
      this.selectedPoi.set(JSON.parse(stringifiedData.poiData));
    });
  }

  renderMarker(): void {
    if (!this._map.loaded()) return;

    this.removeMarker();

    this._markerRef.setLngLat(this._map.getCenter()).addTo(this._map);

    // aktualizuje na bieżąco pozycję markera gdy poruszamy mapą
    this._markerMoveListener = (e: any) => {
      this._markerRef!.setLngLat(e.target.getCenter());
    };
    this._map.on('move', this._markerMoveListener);
  }

  removeMarker() {
    // usuwa obecny marker i jego listenery
    this._markerRef.remove();
    this._map.off('move', this._markerMoveListener);
  }

  moveToPoi(coords: Coords) {
    this._map.flyTo({ center: [coords.lng, coords.lat], zoom: CLOSE_ZOOM });
  }

  getMarkerLatLng(): Coords {
    return this._markerRef.getLngLat();
  }

  ngOnDestroy(): void {
    this._map?.remove();
  }
}
