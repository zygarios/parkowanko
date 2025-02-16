import {
  afterRenderEffect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { booleanPointInPolygon, buffer, point } from '@turf/turf';
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
  private _markerRef!: maplibregl.Marker;

  private _map!: maplibregl.Map;

  private _moveMarkerFnRef: ((e: any) => void) | null = null;
  private _renderFeaturesForMarkerOnMoveFnRef: (() => void) | null = null;

  private _isMapLoaded = signal(false);
  private _renderedParkingsCoordsList: LocationCoords[] = [];

  isMapLoaded = this._isMapLoaded.asReadonly();

  selectedParking = signal<null | Parking>(null);

  constructor() {
    this._prepareAdditionalFeaturesOnLoadMap();
  }

  async initRenderMap(): Promise<void> {
    this._map?.remove();
    this._markerRef?.remove();

    this._markerRef = this._mapRendererService.prepareMarker();
    this._map = await this._mapRendererService.initRenderMap();
    this._map.on('load', () => this._isMapLoaded.set(true));
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
    this._renderedParkingsCoordsList = parkingsList.map(
      (parking) => parking.location,
    );
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
    this._renderRadiusForMarker();

    // aktualizuje na bieżąco pozycję markera gdy poruszamy mapą i rysuje linie między poi a markerem
    this._moveMarkerFnRef = (e: any) => this._moveMarker(e);
    this._map.on('move', this._moveMarkerFnRef);

    // Dodaje dodatkowe opcje wyświetlania, które się aktualizują przy ruchu markera
    this._renderFeaturesForMarkerOnMoveFnRef = () =>
      this._renderFeaturesForMarkerOnMove(fixedCoords);

    this._map.on('moveend', this._renderFeaturesForMarkerOnMoveFnRef);

    this._markerRef.on('dragend', this._renderFeaturesForMarkerOnMoveFnRef);
  }

  private _renderFeaturesForMarkerOnMove(fixedCoords?: LocationCoords) {
    this._renderRadiusForMarker();
    if (fixedCoords) this._renderLineBetweenPoints(fixedCoords);
  }

  private _moveMarker(e: any) {
    this._markerRef!.setLngLat(e.target.getCenter());
  }

  private _renderLineBetweenPoints(fixedCoords: LocationCoords) {
    if (!this.selectedParking()) return;
    this._mapRendererService.renderLineForMarker(this._map, {
      fixedCoords: fixedCoords,
      targetCoords: this._markerRef.getLngLat(),
    });
  }

  private _renderRadiusForMarker() {
    const markerCoords = this._markerRef.getLngLat();
    const markerPoint = point([markerCoords.lng, markerCoords.lat]);

    // Definicja buforu (np. okrąg o promieniu 20 metrów)
    const bufferPoi = buffer(markerPoint, 20, { units: 'meters' });
    if (bufferPoi) {
      // Sprawdzenie, czy jakikolwiek punkt poi znajduje sie w promieniu
      const isAnyPointInRadius = this._renderedParkingsCoordsList.some(
        (coords: LocationCoords) =>
          booleanPointInPolygon([coords.lng, coords.lat], bufferPoi),
      );

      if (isAnyPointInRadius) {
        this._mapRendererService.renderRadiusForMarker(this._map, markerCoords);
      } else {
        this._mapRendererService.renderRadiusForMarker(this._map);
      }
    }
  }

  removeMoveableMarker() {
    this._mapRendererService.renderLineForMarker(this._map);
    this._mapRendererService.renderRadiusForMarker(this._map);
    this._map.off('move', this._moveMarkerFnRef!);
    this._map.off('moveend', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef.off('dragend', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef.remove();
  }

  jumpToPoi(coords: LocationCoords) {
    this._map.jumpTo({ center: [coords.lng, coords.lat], zoom: CLOSE_ZOOM });
  }

  ngOnDestroy(): void {
    this._map?.remove();
  }
}
