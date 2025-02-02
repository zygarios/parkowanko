import {
  afterRenderEffect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../../_types/location-coords.model';
import { Parking } from '../../../../../_types/parking.mode';
import { MapRendererService } from './map-renderer.service';

export const POLAND_BOUNDS = [14, 48, 24.5, 56] as any;
export const POLAND_MAX_BOUNDS = [
  POLAND_BOUNDS[0] - 3,
  POLAND_BOUNDS[1] - 3,
  POLAND_BOUNDS[2] + 3,
  POLAND_BOUNDS[3] + 3,
] as maplibregl.LngLatBoundsLike;
const CLOSE_ZOOM = 16;

@Injectable({ providedIn: 'root' })
export class MapService {
  private _mapRendererService = inject(MapRendererService);
  private _markerRef: maplibregl.Marker =
    this._mapRendererService.prepareMarker();
  private _map!: maplibregl.Map;

  private _moveMarkerFnRef: ((e: any) => void) | null = null;
  private _drawLineBetweenPointsFnRef: (() => void) | null = null;

  private _isMapLoaded = signal(false);

  isMapLoaded = this._isMapLoaded.asReadonly();

  selectedParking = signal<null | Parking>(null);

  constructor() {
    this._prepareAdditionalFeaturesOnLoadMap();
  }

  private _prepareAdditionalFeaturesOnLoadMap() {
    afterRenderEffect(() => {
      if (this.isMapLoaded()) {
        untracked(() => {
          this._mapRendererService.preparePoiForRender(this._map);
          this._listenForPoiClick();
          this._listenForClusterClick();
        });
      }
    });
  }

  async initRenderMap(): Promise<void> {
    this._map = await this._mapRendererService.initRenderMap();
    this._map.on('load', () => this._isMapLoaded.set(true));
  }

  getMarkerLatLng(): LocationCoords {
    return this._markerRef?.getLngLat();
  }

  getMap(): maplibregl.Map {
    return this._map;
  }

  // Wysyła powiadomienia o kliknięciu w poi
  private _listenForPoiClick() {
    const mapRef = this._map;

    mapRef.on('click', 'unclustered-point', (e: any) => {
      // solution for maplibre problem with serializing nested properties
      const stringifiedData = e.features?.[0]?.properties as {
        parking: string;
      };
      this.selectedParking.set(JSON.parse(stringifiedData.parking));
    });
  }

  private _listenForClusterClick() {
    const mapRef = this._map;
    // Centruje i przybliża do klastra z punktami
    mapRef.on('click', 'clusters', (e: any) => {
      mapRef.flyTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        zoom: mapRef.getZoom() + 2.5,
      });
    });
  }

  renderParkingsPois(parkingsList: Parking[]): void {
    this._mapRendererService.renderPois(this._map, parkingsList);
  }

  renderMarkerForFocusPoi(coords: LocationCoords) {
    this.removeMarkerForFocusPoi();
    this._markerRef.setLngLat(coords).addTo(this._map);
  }

  removeMarkerForFocusPoi() {
    this._markerRef.remove();
  }

  renderMoveableMarker(fixedCoords?: LocationCoords): void {
    this.removeMoveableMarker();

    this._markerRef.setLngLat(this._map.getCenter()).addTo(this._map);

    // aktualizuje na bieżąco pozycję markera gdy poruszamy mapą i rysuje linie między poi a markerem
    this._moveMarkerFnRef = (e: any) => this._moveMarker(e);
    this._map.on('move', this._moveMarkerFnRef);

    // rysuje linie między poi a markerem
    if (fixedCoords) {
      this._drawLineBetweenPointsFnRef = () =>
        this._drawLineBetweenPoints(fixedCoords);

      this._map.on('move', this._drawLineBetweenPointsFnRef);

      this._markerRef.on('dragend', this._drawLineBetweenPointsFnRef);
    }
  }

  private _moveMarker(e: any) {
    this._markerRef!.setLngLat(e.target.getCenter());
  }

  private _drawLineBetweenPoints(fixedCoords: LocationCoords) {
    if (!this.selectedParking()) return;
    this._mapRendererService.renderPoiLine(this._map, {
      fixedCoords: fixedCoords,
      targetCoords: this._markerRef.getLngLat(),
    });
  }

  removeMoveableMarker() {
    this._mapRendererService.renderPoiLine(this._map);
    this._map.off('move', this._moveMarkerFnRef!);
    this._map.off('move', this._drawLineBetweenPointsFnRef!);
    this._markerRef.off('dragend', this._drawLineBetweenPointsFnRef!);
    this._markerRef.remove();
  }

  jumpToPoi(coords: LocationCoords) {
    this._map.jumpTo({ center: [coords.lng, coords.lat], zoom: CLOSE_ZOOM });
  }

  ngOnDestroy(): void {
    this._map?.remove();
  }
}
