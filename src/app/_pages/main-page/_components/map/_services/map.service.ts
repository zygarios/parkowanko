import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { booleanPointInPolygon, buffer, point } from '@turf/turf';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../../_types/location-coords.type';
import { Parking } from '../../../../../_types/parking.type';
import { MapRendererService } from './map-renderer.service';

export const POLAND_BOUNDS: [number, number, number, number] = [14, 48, 24.5, 56];
export const POLAND_MAX_BOUNDS = [
  POLAND_BOUNDS[0] - 3,
  POLAND_BOUNDS[1] - 3,
  POLAND_BOUNDS[2] + 3,
  POLAND_BOUNDS[3] + 3,
] as maplibregl.LngLatBoundsLike;
export const PARKING_POI_RADIUS_BOUND = 20;
const CLOSE_ZOOM = 17;
const FAR_ZOOM = 11;
const FLY_SPEED = 2;

@Injectable({ providedIn: 'root' })
export class MapService {
  private _destroyRef = inject(DestroyRef);
  private _mapRendererService = inject(MapRendererService);

  private _map: maplibregl.Map | null = null;
  private _markerRef: maplibregl.Marker | null = null;

  private _moveMarkerFnRef: ((e: any) => void) | null = null;
  private _renderFeaturesForMarkerOnMoveFnRef: (() => void) | null = null;
  private _poiClickFnRef: ((e: MapLayerMouseEvent) => void) | null = null;
  private _clusterClickFnRef: ((e: MapLayerMouseEvent) => void) | null = null;

  private _renderedParkingsCoordsList: LocationCoords[] = [];

  private _isMapLoaded = signal(false);
  getIsMapLoaded = this._isMapLoaded.asReadonly();

  selectedParking = signal<null | Parking>(null);
  isMarkerInsideDisabledZone = signal(false);

  constructor() {
    this._destroyRef.onDestroy(() => this.cleanUp());
  }

  /**
   * Inicjalizuje mapę MapLibre i przygotowuje wszystkie warstwy
   * Czyści poprzednią instancję jeśli istnieje (zapobiega wyciekom pamięci)
   */
  async initRenderMap(): Promise<void> {
    this.cleanUp();

    this._map = await this._mapRendererService.initRenderMap();

    this._map.on('load', () => {
      this._isMapLoaded.set(true);
      this._markerRef = this._mapRendererService.prepareMarker();
      this._mapRendererService.prepareLayersForRender(this._map!);
      this.listenForPoiClick();
      this.listenForClusterClick();
    });
  }

  /**
   * Pobiera aktualne współrzędne markera
   * @returns Współrzędne lng/lat markera
   */
  getMarkerLatLng(): LocationCoords {
    return this._markerRef!.getLngLat();
  }

  /**
   * Nasłuchuje kliknięć na pojedyncze POI parkingów (nieugrupowane)
   * Aktualizuje selectedParking przy kliknięciu użytkownika
   */
  private listenForPoiClick() {
    this._poiClickFnRef = (e: MapLayerMouseEvent) => {
      const stringifiedData = e.features?.[0]?.properties as {
        parking: string;
      };

      if (!stringifiedData) return;

      const parking: Parking = JSON.parse(stringifiedData.parking);

      this.flyToPoi(parking.location);

      this.selectedParking.set(parking);
    };
    this._map!.on('click', 'unclustered-point', this._poiClickFnRef);
  }

  /**
   * Nasłuchuje kliknięć na klastry parkingów
   * Przybliża widok mapy do klikniętego klastra z animacją flyTo
   */
  private listenForClusterClick() {
    this._clusterClickFnRef = (e: MapLayerMouseEvent) =>
      this.flyToPoi(e.lngLat, this._map!.getZoom() + 3);

    this._map!.on('click', 'clusters', this._clusterClickFnRef);
  }

  /**
   * Renderuje POI parkingów na mapie z obsługą klastrowania
   * Przechowuje listę współrzędnych dla późniejszego wykrywania bliskości
   * @param parkingsList - Lista parkingów do wyświetlenia na mapie
   */
  renderParkingsPois(parkingsList: Parking[]): void {
    this._renderedParkingsCoordsList = parkingsList.map((parking) => parking.location);
    this._mapRendererService.renderPois(this._map!, parkingsList);
  }

  /**
   * Renderuje marker w określonym punkcie (fokus na wybrany parking)
   * @param coords - Współrzędne gdzie umieścić marker
   */
  renderMarkerForFocusPoi(coords: LocationCoords) {
    this.removeMarkerForFocusPoi();
    this._markerRef!.setLngLat(coords).addTo(this._map!);
  }

  /**
   * Usuwa marker fokusu z mapy
   */
  removeMarkerForFocusPoi() {
    this._markerRef?.remove();
  }

  /**
   * Renderuje ruchomy marker który podąża za centrum mapy
   * Opcjonalnie rysuje linię do punktu stałego
   * Używane przy dodawaniu nowego parkingu
   * @param fixedCoords - Opcjonalne współrzędne punktu stałego dla rysowania linii dystansu
   */
  renderMoveableMarker(fixedCoords?: LocationCoords): void {
    this.removeMoveableMarker();

    // Ustaw marker w centrum mapy i dodaj do widoku
    this._markerRef!.setLngLat(this._map!.getCenter()).addTo(this._map!);
    this._renderRadiusForParkingPoi();

    // Podłącz marker do ruchu mapy (marker podąża za centrum)
    this._moveMarkerFnRef = (e: any) => this._moveMarker(e);

    // Renderuj dodatkowe features po zakończeniu ruchu mapy lub przeciągnięcia markera
    this._renderFeaturesForMarkerOnMoveFnRef = () =>
      this._renderFeaturesForMarkerOnMove(fixedCoords);

    this._map!.on('move', this._moveMarkerFnRef);
    this._map!.on('move', this._renderFeaturesForMarkerOnMoveFnRef);
    this._markerRef!.on('drag', this._renderFeaturesForMarkerOnMoveFnRef);
  }

  /**
   * Renderuje features mapy po zakończeniu ruchu: promień i opcjonalnie linię
   */
  private _renderFeaturesForMarkerOnMove(fixedCoords?: LocationCoords) {
    this._renderRadiusForParkingPoi();
    if (fixedCoords) this._renderLineBetweenPoints(fixedCoords);
  }

  /**
   * Przesuwa marker do centrum mapy podczas ruchu
   */
  private _moveMarker = (e: any) => {
    this._markerRef!.setLngLat(e.target.getCenter());
  };

  /**
   * Renderuje przerywaną linię między punktem stałym a markerem
   * Używane do pokazania dystansu
   */
  private _renderLineBetweenPoints(fixedCoords: LocationCoords) {
    if (!this.selectedParking()) return;
    this._mapRendererService.renderLineForMarker(this._map!, {
      fixedCoords: fixedCoords,
      targetCoords: this._markerRef!.getLngLat(),
    });
  }

  /**
   * Renderuje promień 20m wokół markera i sprawdza czy jest w nim parking
   * Wyświetla czerwony okrąg jeśli w promieniu znajdzie się jakikolwiek parking
   * Dodatkowo dodaje klasę 'disabled' na markerze aby wizualnie pokazać że nie można tam umieścić parkingu
   * Wykorzystuje bibliotekę Turf.js do obliczeń geometrycznych
   */
  private _renderRadiusForParkingPoi() {
    const markerCoords = this._markerRef!.getLngLat();
    const markerPoint = point([markerCoords.lng, markerCoords.lat]);

    // Utwórz bufor 20m wokół markera używając Turf.js
    const bufferPoi = buffer(markerPoint, PARKING_POI_RADIUS_BOUND, { units: 'meters' });
    if (bufferPoi) {
      // Sprawdź czy którykolwiek z wyrenderowanych parkingów jest w promieniu
      const parkingPoiInRadius = this._renderedParkingsCoordsList.find((coords: LocationCoords) =>
        booleanPointInPolygon([coords.lng, coords.lat], bufferPoi),
      );

      // Renderuj promień tylko jeśli parking jest w zasięgu
      if (parkingPoiInRadius) {
        this._mapRendererService.renderRadiusForParkingPoi(this._map!, parkingPoiInRadius);
        // Dodaj klasę 'disabled' do markera aby pokazać że nie można tu umieścić parkingu
        const markerElement = this._markerRef?.getElement();
        this.isMarkerInsideDisabledZone.set(true);
        if (markerElement) {
          markerElement.classList.add('disabled');
        }
      } else {
        this._mapRendererService.renderRadiusForParkingPoi(this._map!);
        // Usuń klasę 'disabled' z markera
        const markerElement = this._markerRef?.getElement();
        markerElement!.classList.remove('disabled');

        this.isMarkerInsideDisabledZone.set(false);
      }
    }
  }

  /**
   * Usuwa ruchomy marker i czyści związane z nim renderowane features
   * Usuwa event listenery ruchu mapy
   */
  removeMoveableMarker() {
    // Guard clause - sprawdź czy mapa jeszcze istnieje
    if (!this._map) return;

    this._mapRendererService.renderLineForMarker(this._map);
    this._mapRendererService.renderRadiusForParkingPoi(this._map);
    this.isMarkerInsideDisabledZone.set(false);
    this._map.off('move', this._moveMarkerFnRef!);
    this._map.off('move', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef?.off('drag', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef?.remove();
  }

  /**
   * Przeskakuje do określonego punktu na mapie z przybliżeniem
   * @param coords - Współrzędne docelowego punktu
   */
  jumpToPoi(coords: LocationCoords, zoom?: 'CLOSE_ZOOM' | 'FAR_ZOOM') {
    let zoomValue: number | undefined;
    if (zoom === 'CLOSE_ZOOM') zoomValue = CLOSE_ZOOM;
    if (zoom === 'FAR_ZOOM') zoomValue = FAR_ZOOM;
    this._map!.jumpTo({ center: [coords.lng, coords.lat], zoom: zoomValue });
  }

  /**
   * Przelatuje do określonego punktu na mapie z przybliżeniem
   * @param coords - Współrzędne docelowego punktu
   */
  flyToPoi(coords: LocationCoords, zoom: 'CLOSE_ZOOM' | 'FAR_ZOOM' | number = CLOSE_ZOOM) {
    let zoomValue!: number;
    if (zoom === 'FAR_ZOOM') zoomValue = FAR_ZOOM;
    if (zoom === 'CLOSE_ZOOM') zoomValue = CLOSE_ZOOM;
    else zoomValue = zoom as number;
    this._map!.flyTo({ center: [coords.lng, coords.lat], zoom: zoomValue, speed: FLY_SPEED });
  }

  /**
   * Czyści wszystkie zasoby mapy, event listenery i referencje
   * KRYTYCZNE: Zapobiega wyciekom pamięci przy nawigacji między widokami
   * Wywołuje się automatycznie przez DestroyRef w komponencie
   */
  cleanUp() {
    this._cleanUpListeners();
    this._cleanUpMapCore();
  }

  private _cleanUpListeners() {
    // Usuń event listenery POI i klastrów
    if (this._poiClickFnRef) {
      this._map?.off('click', 'unclustered-point', this._poiClickFnRef);
      this._poiClickFnRef = null;
    }
    if (this._clusterClickFnRef) {
      this._map?.off('click', 'clusters', this._clusterClickFnRef);
      this._clusterClickFnRef = null;
    }

    // Usuń listenery ruchomego markera jeśli istnieją
    if (this._moveMarkerFnRef) {
      this._map?.off('move', this._moveMarkerFnRef);
      this._moveMarkerFnRef = null;
    }
    if (this._renderFeaturesForMarkerOnMoveFnRef) {
      this._map?.off('move', this._renderFeaturesForMarkerOnMoveFnRef);
      this._markerRef?.off('drag', this._renderFeaturesForMarkerOnMoveFnRef);
      this._renderFeaturesForMarkerOnMoveFnRef = null;
    }
  }

  private _cleanUpMapCore() {
    // Usuń instancje mapy i markera z DOM
    this._markerRef?.remove();
    this._map?.remove();

    // Wyzeruj referencje (zapobiega wyciekowi pamięci)
    this.selectedParking.set(null);
    this.isMarkerInsideDisabledZone.set(false);
    this._map = null;
    this._markerRef = null;
    this._renderedParkingsCoordsList = [];
    this._isMapLoaded.set(false);
  }
}
