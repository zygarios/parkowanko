import { DestroyRef, inject, Injectable, signal } from '@angular/core';
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
import { ParkingsApiService } from '../../../../_services/_api/parkings-api.service';
import { GlobalSpinnerService } from '../../../../_services/_core/global-spinner.service';
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
  private _globalSpinnerService = inject(GlobalSpinnerService);
  private _parkingsApiService = inject(ParkingsApiService);
  private _destroyRef = inject(DestroyRef);

  private _map: maplibregl.Map | null = null;
  private _markerRef: maplibregl.Marker | null = null;

  private _moveMarkerFnRef: ((e: any) => void) | null = null;
  private _renderFeaturesForMarkerOnMoveFnRef: (() => void) | null = null;
  private _poiClickFnRef: ((e: MapLayerMouseEvent) => void) | null = null;
  private _clusterClickFnRef: ((e: MapLayerMouseEvent) => void) | null = null;

  private _isMapLoaded = signal<boolean>(false);

  isMapLoaded = this._isMapLoaded.asReadonly();

  private _renderedParkingIds = signal<number[]>([]);
  isMarkerInRadiusOfOtherParking = signal(false);
  isMarkerInRadiusOfOriginalParking = signal(true);

  selectedParkingId = signal<number | null>(null);

  constructor() {
    this._destroyRef.onDestroy(() => {
      this._cleanUpListeners();
      this._cleanUpMapCore();
    });
  }

  /**
   * Inicjalizuje mapę MapLibre i przygotowuje wszystkie warstwy
   * Czyści poprzednią instancję jeśli istnieje (zapobiega wyciekom pamięci)
   */
  async initRenderMap(): Promise<void> {
<<<<<<< Updated upstream
=======
    this._globalSpinnerService.show({ hasBackdrop: false, message: 'Pobieranie danych...' });
    this._cleanUpMapCore();
>>>>>>> Stashed changes
    this._markerRef = this._mapInitializerService.prepareMarker();

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
      const properties = e.features?.[0]?.properties as {
        parkingId: number;
      };

      if (!properties?.parkingId) return;

      this.selectedParkingId.set(properties.parkingId);
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
    this._renderedParkingIds.set(parkingsList.map((p) => p.id));
    this._mapRendererService.renderPois(this._map!, parkingsList);
  }

  /**
   * Renderuje ruchomy marker który podąża za centrum mapy
   * Opcjonalnie rysuje linię do punktu stałego
   * Używane przy dodawaniu nowego parkingu
   * @param fixedCoords - Opcjonalne współrzędne punktu stałego dla rysowania linii dystansu
   */
  renderMoveableMarkerWithRadiusAndLineToFixedPoint(fixedCoords?: LocationCoords): void {
    this.removeMoveableMarker();

    this._markerRef!.setDraggable(true);

    // Ustaw marker w centrum mapy i dodaj do widoku
    this._markerRef!.setLngLat(this._map!.getCenter()).addTo(this._map!);
    this._renderFeaturesForParkingPoi(fixedCoords);

    // Podłącz marker do ruchu mapy (marker podąża za centrum)
    this._moveMarkerFnRef = (e: any) => this._moveMarker(e);

    // Podłącz marker do ruchu mapy (marker podąża za centrum)
    this._moveMarkerFnRef = (e: any) => this._moveMarker(e, fixedCoords);

    // Renderuj dodatkowe features po zakończeniu ruchu mapy lub przeciągnięcia markera
    this._renderFeaturesForMarkerOnMoveFnRef = () =>
      this._renderFeaturesForMarkerOnMove(fixedCoords);

    this._map!.on('move', this._moveMarkerFnRef);
    this._map!.on('moveend', this._renderFeaturesForMarkerOnMoveFnRef);
    this._markerRef!.on('drag', this._renderFeaturesForMarkerOnMoveFnRef);
    this._markerRef!.on('dragend', this._renderFeaturesForMarkerOnMoveFnRef);
  }

  /**
   * Renderuje features mapy po zakończeniu ruchu: promienie i linię dystansu
   */
  private _renderFeaturesForMarkerOnMove(fixedCoords?: LocationCoords) {
    this._renderFeaturesForParkingPoi(fixedCoords);
  }

  /**
   * Przesuwa marker do centrum mapy podczas ruchu
   */
  private _moveMarker = (e: any, fixedCoords?: LocationCoords) => {
    this._markerRef!.setLngLat(e.target.getCenter());
    this._renderFeaturesForParkingPoi(fixedCoords);
  };

  /**
   * Renderuje promienie wokół wszystkich widocznych punktów parkingowych
   * Zarządza również linią dystansu (priorytet ma linia kolizji)
   * @param oldLocationCoords - Opcjonalne współrzędne starej lokalizacji (przy edycji)
   */
  private _renderFeaturesForParkingPoi(oldLocationCoords?: LocationCoords) {
    const markerCoords = this.getMarkerLatLng();
    const markerPoint = point([markerCoords.lng, markerCoords.lat]);
    const bounds = this._map!.getBounds();
    const excludeId = this.selectedParkingId();

    // 0. Renderowanie obszaru dozwolonej edycji (100m)
    this._mapRendererService.renderEditArea(this._map!, oldLocationCoords);

    // 1. Renderowanie wszystkich promieni (niebieskie / czerwone)
    // Wykluczamy aktualnie edytowany punkt z kolizji, aby móc go "przesunąć" o mały dystans
    const allParkings = this._parkingsApiService.getParkings()();
    const renderedIds = this._renderedParkingIds();

    const parkingsToCheck = excludeId
      ? allParkings.filter((p: ParkingPoint) => renderedIds.includes(p.id) && p.id !== excludeId)
      : allParkings.filter((p: ParkingPoint) => renderedIds.includes(p.id));

    const visiblePoints = parkingsToCheck
      .filter((p: ParkingPoint) => bounds.contains([p.location.lng, p.location.lat]))
      .map((p: ParkingPoint) => p.location);

    const bufferPoi = buffer(markerPoint, mapConfigData.PARKING_POI_RADIUS_BOUND, {
      units: 'meters',
    });

    if (!bufferPoi) return;

    // Sprawdzamy czy marker koliduje z JAKIMKOLWIEK parkingiem (oprócz edytowanego)
    const parkingPoiInRadius = parkingsToCheck.find((p: ParkingPoint) =>
      booleanPointInPolygon([p.location.lng, p.location.lat], bufferPoi),
    )?.location;

    this._mapRendererService.renderRadiiForPois(this._map!, visiblePoints, parkingPoiInRadius);

    // 2. Zarządzanie linią dystansu i stanem markera
    const markerElement = this._markerRef?.getElement();

    // Sprawdzamy czy marker jest w zasięgu oryginału (przy edycji)
    let isWithinRangeOfOriginal = true;
    if (oldLocationCoords) {
      const dist = distance(point([oldLocationCoords.lng, oldLocationCoords.lat]), markerPoint, {
        units: 'meters',
      });
      isWithinRangeOfOriginal = dist <= mapConfigData.MAX_DISTANCE_TO_EDIT_LOCATION_METERS;
    }

    const isInRadiusOfOriginal = oldLocationCoords ? isWithinRangeOfOriginal : true;
    const isInRadiusOfOther = !!parkingPoiInRadius;

    this.isMarkerInRadiusOfOtherParking.set(isInRadiusOfOther);
    this.isMarkerInRadiusOfOriginalParking.set(isInRadiusOfOriginal);

    if (isInRadiusOfOther || !isInRadiusOfOriginal) {
      markerElement?.classList.add('disabled');

      this.renderLineBetweenPoints({
        fixedCoords: parkingPoiInRadius || oldLocationCoords!,
        targetCoords: markerCoords,
        isColliding: true,
      });
    } else {
      markerElement?.classList.remove('disabled');

      if (oldLocationCoords) {
        // Jeśli nie ma kolizji, ale edytujemy punkt -> pokazujemy dystans od oryginału
        this.renderLineBetweenPoints({
          fixedCoords: oldLocationCoords,
          targetCoords: markerCoords,
          isColliding: false,
        });
      } else {
        // W przeciwnym razie usuwamy linię całkowicie
        this.removeLineBetweenPoints();
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

    this.removeLineBetweenPoints();
    this._mapRendererService.renderRadiiForPois(this._map, []);
    this._mapRendererService.renderEditArea(this._map);
    this.isMarkerInRadiusOfOtherParking.set(false);
    this.isMarkerInRadiusOfOriginalParking.set(true);
    this._map.off('move', this._moveMarkerFnRef!);
    this._map.off('moveend', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef?.off('drag', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef?.off('dragend', this._renderFeaturesForMarkerOnMoveFnRef!);
    this._markerRef?.remove();
  }

  renderLineBetweenPoints(points?: {
    fixedCoords: LocationCoords;
    targetCoords: LocationCoords;
    isColliding?: boolean;
  }) {
    this._mapRendererService.renderLineBetweenPoints(this._map!, points);
  }

  removeLineBetweenPoints() {
    this._mapRendererService.renderLineBetweenPoints(this._map!);
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
    this._globalSpinnerService.show({
      message: 'Szukanie najbliższego parkingu...',
      hasBackdrop: true,
    });

    // Jeśli nie podano współrzędnych, pobierz aktualną lokalizację
    let locationCoords: LocationCoords;
    if (coords) {
      locationCoords = coords;
    } else {
      try {
        const position = await this._getCurrentPositionGPS();
        locationCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (err) {
        this._globalSpinnerService.hide();
        this._sharedUtilsService.openSnackbar('Nie udało się pobrać lokalizacji GPS.', 'ERROR');
        return;
      }
    }

    this._globalSpinnerService.hide();

    const allParkings = this._parkingsApiService.getParkings()();
    const renderedIds = this._renderedParkingIds();
    const renderedParkings = allParkings.filter((p) => renderedIds.includes(p.id));

    if (renderedParkings.length === 0) {
      this._sharedUtilsService.openSnackbar('Brak parkingów do przeszukania.', 'ERROR');
      return;
    }

    const points = featureCollection(
      renderedParkings.map((p: ParkingPoint) =>
        point([p.location.lng, p.location.lat], { original: p.location }),
      ),
    );

    const nearestFeature = nearestPoint(point([locationCoords.lng, locationCoords.lat]), points);
    const nearestParkingLocationCoords = nearestFeature.properties['original'] as LocationCoords;

    const dist = distance(
      point([locationCoords.lng, locationCoords.lat]),
      point([nearestParkingLocationCoords.lng, nearestParkingLocationCoords.lat]),
      { units: 'kilometers' },
    );

    if (dist <= mapConfigData.MAX_DISTANCE_TO_NEAREST_PARKING_KM) {
      this.renderLineBetweenPoints({
        fixedCoords: locationCoords,
        targetCoords: nearestParkingLocationCoords,
        isColliding: false,
      });

      this.fitBoundsToPoints(locationCoords, nearestParkingLocationCoords);
    } else {
      this._sharedUtilsService.openSnackbar(
        `Nie znaleziono najbliższego parkingu w zasięgu ${mapConfigData.MAX_DISTANCE_TO_NEAREST_PARKING_KM} km.`,
      );
    }
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

    try {
      this.removeLineBetweenPoints();
      this.removeTargetLocationPoi();
      this._markerRef?.remove();
      this._map?.remove();
    } catch (e) {
      console.warn('Error during map cleanup:', e);
    }

    // Wyzeruj referencje (zapobiega wyciekowi pamięci)
    this.selectedParkingId.set(null);
    this.isMarkerInRadiusOfOtherParking.set(false);
    this.isMarkerInRadiusOfOriginalParking.set(true);
    this._map = null;
    this._markerRef = null;
    this._renderedParkingIds.set([]);
    this._isMapLoaded.set(false);
  }
}
