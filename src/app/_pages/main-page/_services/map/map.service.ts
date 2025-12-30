import { inject, Injectable, signal } from '@angular/core';
import {
  booleanPointInPolygon,
  buffer,
  distance,
  featureCollection,
  nearestPoint,
  point,
} from '@turf/turf';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { LocationCoords } from '../../../../_types/location-coords.type';
import { ParkingPoint } from '../../../../_types/parking-point.type';
import { mapConfigData } from '../../_data/map-config-data';
import { MapInitializerService } from './map-initializer.service';
import { MapRendererService } from './map-renderer.service';

@Injectable()
export class MapService {
  private _mapInitializerService = inject(MapInitializerService);
  private _mapRendererService = inject(MapRendererService);
  private _sharedUtilsService = inject(SharedUtilsService);

  private _map: maplibregl.Map | null = null;
  private _markerRef: maplibregl.Marker | null = this._mapInitializerService.prepareMarker();

  private _moveMarkerFnRef: ((e: any) => void) | null = null;
  private _renderFeaturesForMarkerOnMoveFnRef: (() => void) | null = null;
  private _poiClickFnRef: ((e: MapLayerMouseEvent) => void) | null = null;
  private _clusterClickFnRef: ((e: MapLayerMouseEvent) => void) | null = null;

  private _renderedParkingsCoordsList: LocationCoords[] = [];
  private _isMapLoaded = signal<boolean>(false);

  isMapLoaded = this._isMapLoaded.asReadonly();

  selectedParking = signal<null | ParkingPoint>(null);
  isMarkerInsideDisabledZone = signal(false);

  /**
   * Inicjalizuje mapę MapLibre i przygotowuje wszystkie warstwy
   * Czyści poprzednią instancję jeśli istnieje (zapobiega wyciekom pamięci)
   */
  async initRenderMap(): Promise<void> {
    const { map } = await this._mapInitializerService.initRenderMap();
    this._map = map;

    this._map.on('load', () => {
      this.listenForPoiClickToSetSelectedParking();
      this.listenForClusterClickToFlyCloser();
      this._isMapLoaded.set(true);
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
  private listenForPoiClickToSetSelectedParking() {
    this._poiClickFnRef = (e: MapLayerMouseEvent) => {
      const stringifiedData = e.features?.[0]?.properties as {
        parking: string;
      };

      if (!stringifiedData) return;

      const parking: ParkingPoint = JSON.parse(stringifiedData.parking);

      this.selectedParking.set(parking);
    };
    this._map!.on('click', 'unclustered-point', this._poiClickFnRef);
  }

  /**
   * Nasłuchuje kliknięć na klastry parkingów
   * Przybliża widok mapy do klikniętego klastra z animacją flyTo
   */
  private listenForClusterClickToFlyCloser() {
    this._clusterClickFnRef = (e: MapLayerMouseEvent) => {
      this.flyToPoi(e.lngLat, this._map!.getZoom() + 3);
    };

    this._map!.on('click', 'clusters', this._clusterClickFnRef);
  }

  /**
   * Renderuje POI parkingów na mapie z obsługą klastrowania
   * Przechowuje listę współrzędnych dla późniejszego wykrywania bliskości
   * @param parkingsList - Lista parkingów do wyświetlenia na mapie
   */
  renderParkingsPois(parkingsList: ParkingPoint[]): void {
    this._renderedParkingsCoordsList = parkingsList.map((parking) => parking.location);
    this._mapRendererService.renderPois(this._map!, parkingsList);
  }

  /**
   * Renderuje marker w określonym punkcie (fokus na wybrany parking)
   * @param coords - Współrzędne gdzie umieścić marker
   */
  renderMarker(coords: LocationCoords) {
    this.removeMarker();
    this._markerRef?.setDraggable(false);
    this._markerRef!.setLngLat(coords).addTo(this._map!);
  }

  /**
   * Usuwa marker fokusu z mapy
   */
  removeMarker() {
    this._markerRef?.remove();
  }

  /**
   * Renderuje ruchomy marker który podąża za centrum mapy
   * Opcjonalnie rysuje linię do punktu stałego
   * Używane przy dodawaniu nowego parkingu
   * @param fixedCoords - Opcjonalne współrzędne punktu stałego dla rysowania linii dystansu
   */
  renderMoveableMarkerWithRadiusAndLineToFixedPoint(fixedCoords?: LocationCoords): void {
    this.removeMoveableMarker();

    this._markerRef?.setDraggable(true);

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
    this._mapRendererService.renderLineBetweenPoints(this._map!, {
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
    const bufferPoi = buffer(markerPoint, mapConfigData.PARKING_POI_RADIUS_BOUND, {
      units: 'meters',
    });
    if (bufferPoi) {
      // Sprawdź czy którykolwiek z wyrenderowanych parkingów jest w promieniu
      const parkingPoiInRadius = this._renderedParkingsCoordsList.find((coords: LocationCoords) =>
        booleanPointInPolygon([coords.lng, coords.lat], bufferPoi),
      );

      // Renderuj promień tylko jeśli parking jest w zasięgu
      if (parkingPoiInRadius) {
        this._mapRendererService.renderRadiusForPoi(this._map!, parkingPoiInRadius);
        // Dodaj klasę 'disabled' do markera aby pokazać że nie można tu umieścić parkingu
        const markerElement = this._markerRef?.getElement();

        this.isMarkerInsideDisabledZone.set(true);

        this._mapRendererService.renderLineBetweenPoints(this._map!, {
          fixedCoords: parkingPoiInRadius,
          targetCoords: markerCoords,
        });

        if (markerElement) {
          markerElement.classList.add('disabled');
        }
      } else {
        this._mapRendererService.renderRadiusForPoi(this._map!);
        // Usuń klasę 'disabled' z markera
        const markerElement = this._markerRef?.getElement();
        markerElement!.classList.remove('disabled');

        this.isMarkerInsideDisabledZone.set(false);

        this._mapRendererService.renderLineBetweenPoints(this._map!);
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

    this._mapRendererService.renderLineBetweenPoints(this._map);
    this._mapRendererService.renderRadiusForPoi(this._map);
    this.isMarkerInsideDisabledZone.set(false);
    this._map.off('move', this._moveMarkerFnRef!);
    this._map.off('move', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef?.off('drag', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef?.remove();
  }

  renderLineBetweenPoints(points?: { fixedCoords: LocationCoords; targetCoords: LocationCoords }) {
    this._mapRendererService.renderLineBetweenPoints(this._map!, points);
  }

  /**
   * Renderuje ikonę celu (wybrany adres) na mapie
   * @param coords - Współrzędne celu
   */
  renderTargetLocationPoi(coords: LocationCoords) {
    this._mapRendererService.renderTargetLocationPoi(this._map!, coords);
  }

  removeTargetLocationPoi() {
    this._mapRendererService.renderTargetLocationPoi(this._map!);
  }

  /**
   * Przeskakuje do określonego punktu na mapie z przybliżeniem
   * @param coords - Współrzędne docelowego punktu
   */
  jumpToPoi(
    coords: LocationCoords,
    zoom: 'CLOSE_ZOOM' | 'FAR_ZOOM' | number = mapConfigData.CLOSE_ZOOM,
  ) {
    let zoomValue!: number;
    if (zoom === 'FAR_ZOOM') zoomValue = mapConfigData.FAR_ZOOM;
    else if (zoom === 'CLOSE_ZOOM') zoomValue = mapConfigData.CLOSE_ZOOM;
    else zoomValue = zoom as number;
    this._map!.jumpTo({ center: [coords.lng, coords.lat], zoom: zoomValue });
  }

  /**
   * Przelatuje do określonego punktu na mapie z przybliżeniem
   * @param coords - Współrzędne docelowego punktu
   */
  flyToPoi(
    coords: LocationCoords,
    zoom: 'CLOSE_ZOOM' | 'FAR_ZOOM' | number = mapConfigData.CLOSE_ZOOM,
  ) {
    let zoomValue!: number;
    if (zoom === 'FAR_ZOOM') zoomValue = mapConfigData.FAR_ZOOM;
    else if (zoom === 'CLOSE_ZOOM') zoomValue = mapConfigData.CLOSE_ZOOM;
    else zoomValue = zoom as number;

    this._map!.flyTo({
      center: [coords.lng, coords.lat],
      zoom: zoomValue,
      speed: mapConfigData.FLY_SPEED,
    });
  }

  private _getCurrentPositionGPS(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });
  }

  async findNearestParking(coords?: LocationCoords) {
    // Jeśli nie podano współrzędnych, pobierz aktualną lokalizację
    let locationCoords: LocationCoords;
    if (coords) {
      locationCoords = coords;
    } else {
      const position = await this._getCurrentPositionGPS();
      locationCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    }

    if (this._renderedParkingsCoordsList.length === 0) {
      this._sharedUtilsService.openSnackbar('Brak parkingów do przeszukania.', 'ERROR');
      return;
    }

    const points = featureCollection(
      this._renderedParkingsCoordsList.map((p) => point([p.lng, p.lat], { original: p })),
    );

    const nearestFeature = nearestPoint([locationCoords.lng, locationCoords.lat], points);
    const nearestParkingLocationCoords = nearestFeature.properties['original'] as LocationCoords;

    const dist = distance(
      [locationCoords.lng, locationCoords.lat],
      [nearestParkingLocationCoords.lng, nearestParkingLocationCoords.lat],
    );

    if (dist <= mapConfigData.MAX_DISTANCE_TO_NEAREST_PARKING_KM) {
      this._mapRendererService.renderLineBetweenPoints(this._map!, {
        fixedCoords: locationCoords,
        targetCoords: nearestParkingLocationCoords,
      });

      this.fitBoundsToPoints(locationCoords, nearestParkingLocationCoords);
    } else {
      this._sharedUtilsService.openSnackbar(
        `Nie znaleziono najbliższego parkingu w zasięgu ${mapConfigData.MAX_DISTANCE_TO_NEAREST_PARKING_KM} km.`,
      );
    }
  }

  fitBoundsToPoints(firstLocationCoords: LocationCoords, secondsLocationCoords: LocationCoords) {
    const bounds = new maplibregl.LngLatBounds()
      .extend([firstLocationCoords.lng, firstLocationCoords.lat])
      .extend([secondsLocationCoords.lng, secondsLocationCoords.lat]);

    this._map!.fitBounds(bounds, {
      padding: { top: 100, bottom: 250, left: 70, right: 70 },
      duration: 1000,
      essential: true,
    });
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
    if (!this._map) return;

    this._mapRendererService.renderLineBetweenPoints(this._map);
    this._mapRendererService.renderTargetLocationPoi(this._map);
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
