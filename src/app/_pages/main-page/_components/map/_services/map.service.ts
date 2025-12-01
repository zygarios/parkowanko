import { afterRenderEffect, inject, Injectable, signal, untracked } from '@angular/core';
import { booleanPointInPolygon, buffer, point } from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../../_types/location-coords.model';
import { Parking } from '../../../../../_types/parking.model';
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
  private mapRendererService = inject(MapRendererService);
  private markerRef!: maplibregl.Marker;

  private map!: maplibregl.Map;

  private moveMarkerFnRef: ((e: any) => void) | null = null;
  private renderFeaturesForMarkerOnMoveFnRef: (() => void) | null = null;

  private isMapLoaded = signal(false);
  private renderedParkingsCoordsList: LocationCoords[] = [];

  getIsMapLoaded = this.isMapLoaded.asReadonly();

  selectedParking = signal<null | Parking>(null);

  constructor() {
    this.prepareAdditionalFeaturesOnLoadMap();
  }

  async initRenderMap(): Promise<void> {
    this.map?.remove();
    this.markerRef?.remove();

    this.markerRef = this.mapRendererService.prepareMarker();
    this.map = await this.mapRendererService.initRenderMap();
    this.map.on('load', () => this.isMapLoaded.set(true));
  }

  private prepareAdditionalFeaturesOnLoadMap() {
    afterRenderEffect(() => {
      if (this.isMapLoaded()) {
        untracked(() => {
          this.mapRendererService.preparePoiForRender(this.map);
          this.listenForPoiClick();
          this.listenForClusterClick();
        });
      }
    });
  }

  getMarkerLatLng(): LocationCoords {
    return this.markerRef?.getLngLat();
  }

  getMap(): maplibregl.Map {
    return this.map;
  }

  // Wysyła powiadomienia o kliknięciu w poi
  private listenForPoiClick() {
    const mapRef = this.map;

    mapRef.on('click', 'unclustered-point', (e: any) => {
      // solution for maplibre problem with serializing nested properties
      const stringifiedData = e.features?.[0]?.properties as {
        parking: string;
      };
      this.selectedParking.set(JSON.parse(stringifiedData.parking));
    });
  }

  private listenForClusterClick() {
    const mapRef = this.map;
    // Centruje i przybliża do klastra z punktami
    mapRef.on('click', 'clusters', (e: any) => {
      mapRef.flyTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        zoom: mapRef.getZoom() + 2.5,
      });
    });
  }

  renderParkingsPois(parkingsList: Parking[]): void {
    this.renderedParkingsCoordsList = parkingsList.map((parking) => parking.location);
    this.mapRendererService.renderPois(this.map, parkingsList);
  }

  renderMarkerForFocusPoi(coords: LocationCoords) {
    this.removeMarkerForFocusPoi();
    this.markerRef.setLngLat(coords).addTo(this.map);
  }

  removeMarkerForFocusPoi() {
    this.markerRef.remove();
  }

  renderMoveableMarker(fixedCoords?: LocationCoords): void {
    this.removeMoveableMarker();

    this.markerRef.setLngLat(this.map.getCenter()).addTo(this.map);
    this.renderRadiusForMarker();

    // aktualizuje na bieżąco pozycję markera gdy poruszamy mapą i rysuje linie między poi a markerem
    this.moveMarkerFnRef = (e: any) => this.moveMarker(e);
    this.map.on('move', this.moveMarkerFnRef);

    // Dodaje dodatkowe opcje wyświetlania, które się aktualizują przy ruchu markera
    this.renderFeaturesForMarkerOnMoveFnRef = () => this.renderFeaturesForMarkerOnMove(fixedCoords);

    this.map.on('moveend', this.renderFeaturesForMarkerOnMoveFnRef);

    this.markerRef.on('dragend', this.renderFeaturesForMarkerOnMoveFnRef);
  }

  private renderFeaturesForMarkerOnMove(fixedCoords?: LocationCoords) {
    this.renderRadiusForMarker();
    if (fixedCoords) this.renderLineBetweenPoints(fixedCoords);
  }

  private moveMarker(e: any) {
    this.markerRef!.setLngLat(e.target.getCenter());
  }

  private renderLineBetweenPoints(fixedCoords: LocationCoords) {
    if (!this.selectedParking()) return;
    this.mapRendererService.renderLineForMarker(this.map, {
      fixedCoords: fixedCoords,
      targetCoords: this.markerRef.getLngLat(),
    });
  }

  private renderRadiusForMarker() {
    const markerCoords = this.markerRef.getLngLat();
    const markerPoint = point([markerCoords.lng, markerCoords.lat]);

    // Definicja buforu (np. okrąg o promieniu 20 metrów)
    const bufferPoi = buffer(markerPoint, 20, { units: 'meters' });
    if (bufferPoi) {
      // Sprawdzenie, czy jakikolwiek punkt poi znajduje sie w promieniu
      const isAnyPointInRadius = this.renderedParkingsCoordsList.some((coords: LocationCoords) =>
        booleanPointInPolygon([coords.lng, coords.lat], bufferPoi),
      );

      if (isAnyPointInRadius) {
        this.mapRendererService.renderRadiusForMarker(this.map, markerCoords);
      } else {
        this.mapRendererService.renderRadiusForMarker(this.map);
      }
    }
  }

  removeMoveableMarker() {
    this.mapRendererService.renderLineForMarker(this.map);
    this.mapRendererService.renderRadiusForMarker(this.map);
    this.map.off('move', this.moveMarkerFnRef!);
    this.map.off('moveend', this.renderFeaturesForMarkerOnMoveFnRef!);
    this.markerRef.off('dragend', this.renderFeaturesForMarkerOnMoveFnRef!);
    this.markerRef.remove();
  }

  jumpToPoi(coords: LocationCoords) {
    this.map.jumpTo({ center: [coords.lng, coords.lat], zoom: CLOSE_ZOOM });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
