import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../_types/location-coords.model';
import { Parking } from '../../_types/parking.mode';
import { MapRendererService } from './map-renderer.service';

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
  private _mapRendererService = inject(MapRendererService);
  private _markerMoveListener: any;
  private _markerRef: maplibregl.Marker =
    this._mapRendererService.prepareMarker();
  private _map!: maplibregl.Map;

  private _selectingMode: 'enabled' | 'disabled' = 'enabled';
  selectedPoi = signal<null | Parking>(null);

  private _isMapLoaded = signal(false);
  isMapLoaded = this._isMapLoaded.asReadonly();

  constructor() {
    this._prepareAdditionalFeaturesOnLoadMap();
  }

  private _prepareAdditionalFeaturesOnLoadMap() {
    effect(() => {
      if (this.isMapLoaded()) {
        untracked(() => {
          this._listenForPoiClick();
          this._mapRendererService.preparePoiLayers(this._map, 'parkings');
        });
      }
    });
  }

  getMarkerLatLng(): LocationCoords {
    return this._markerRef?.getLngLat();
  }

  setSelectingMode(type: 'enabled' | 'disabled') {
    this._selectingMode = type;
  }

  getMap(): maplibregl.Map {
    return this._map;
  }

  async initialRenderMap(): Promise<void> {
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
      )
      .on('load', () => this._isMapLoaded.set(true));
  }

  private _listenForPoiClick() {
    this._map.on('click', 'unclustered-point', (e: any) => {
      if (this._selectingMode === 'disabled') return;
      // solution for maplibre problem with serializing nested properties
      const stringifiedData = e.features?.[0]?.properties as {
        poiData: string;
      };
      this.selectedPoi.set(JSON.parse(stringifiedData.poiData));
    });
  }

  renderPoiList(poiListCoords: Parking[]): void {
    const sourceId = 'parkings';
    let source = this._map.getSource(sourceId) as maplibregl.GeoJSONSource;

    // Nadpisanie danych o punktach poi na mapie
    source.setData({
      type: 'FeatureCollection',
      features: poiListCoords.map((poiData) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [poiData.location.lng, poiData.location.lat],
        },
        properties: {
          poiData,
        },
      })),
    });
  }

  renderMarkerForFocusPoi(coords: LocationCoords) {
    this.removeMarkerForFocusPoi();
    this._markerRef.setLngLat(coords).addTo(this._map);
  }

  removeMarkerForFocusPoi() {
    this._markerRef.remove();
  }

  renderMoveableMarker(): void {
    this.removeMoveableMarker();

    this._markerRef.setLngLat(this._map.getCenter()).addTo(this._map);

    // aktualizuje na bieżąco pozycję markera gdy poruszamy mapą
    this._markerMoveListener = (e: any) => {
      this._markerRef!.setLngLat(e.target.getCenter());

      (this._map.getSource('line-source') as maplibregl.GeoJSONSource).setData(
        this._mapRendererService.getLineGeoJson(
          this.selectedPoi()?.location,
          this._markerRef.getLngLat(),
        ),
      );
    };

    this._map.on('move', this._markerMoveListener);
  }

  removeMoveableMarker() {
    this._markerRef.remove();
    const lineSource = this._map.getSource(
      'line-source',
    ) as maplibregl.GeoJSONSource;

    lineSource.setData(this._mapRendererService.getLineGeoJson());
    this._map.off('move', this._markerMoveListener);
  }

  jumpToPoi(coords: LocationCoords) {
    this._map.jumpTo({ center: [coords.lng, coords.lat], zoom: CLOSE_ZOOM });
  }

  ngOnDestroy(): void {
    this._map?.remove();
  }
}
