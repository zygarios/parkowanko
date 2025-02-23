import { Injectable } from '@angular/core';
import { circle } from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import { environment } from '../../../../../../environments/environment.development';
import { LocationCoords } from '../../../../../_types/location-coords.model';
import { Parking } from '../../../../../_types/parking.model';
import { POLAND_BOUNDS, POLAND_MAX_BOUNDS } from './map.service';

export const PARKING_POI_SOURCE = 'parkingPoiSource';
export const PARKING_MARKER_RADIUS_SOURCE = 'parkingMarkerRadiusSource';
const PARKING_POI_LINE_SOURCE = 'parkingPoiLineSource';

@Injectable({
  providedIn: 'root',
})
export class MapRendererService {
  async initRenderMap(): Promise<maplibregl.Map> {
    const style = await import('../../../../../../../public/osm_bright.json');

    const mapRef = new maplibregl.Map({
      container: 'map',
      maxBounds: POLAND_MAX_BOUNDS,
      bounds: POLAND_BOUNDS,
      style: style as any,
    })
      .addControl(new maplibregl.NavigationControl({ showCompass: false }))
      .addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          showAccuracyCircle: false,
          trackUserLocation: true,
          fitBoundsOptions: { maxZoom: 17 },
        }),
      );
    mapRef.touchZoomRotate.disableRotation();

    // Załadowanie ikony poi dla pojedynczego punktu
    const imageUrl = '/icons/parking-free-poi.png';

    const imageBitmap = await fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => createImageBitmap(blob));

    mapRef.addImage('parking-poi-icon', imageBitmap);

    return mapRef;
  }

  prepareMarker(): maplibregl.Marker {
    // Ustawienie warstwy markera pod przyszłe wykorzystanie
    const el = document.createElement('div');
    el.className = 'marker';

    return new maplibregl.Marker({
      element: el,
      draggable: true,
    });
  }

  async preparePoiForRender(map: maplibregl.Map): Promise<void> {
    this._prepareLayersForPoisWithClusters(map);
    this._prepareLayersForPoisRadius(map);
    this._prepareLayersForPoiLines(map);
  }

  renderPois(map: maplibregl.Map, parkingsList: Parking[]) {
    const parkingPoiSource = map.getSource(
      PARKING_POI_SOURCE,
    ) as maplibregl.GeoJSONSource;

    // Nadpisanie danych o punktach poi na mapie
    parkingPoiSource.setData({
      type: 'FeatureCollection',
      features: parkingsList.map((parking) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parking.location.lng, parking.location.lat],
        },
        properties: {
          parking,
        },
      })),
    });
  }

  renderRadiusForMarker(map: maplibregl.Map, markerCoors?: LocationCoords) {
    // Dodanie radiusa do markera, który okresla w jakieś minimalnie odlegości nie może się znajdować żaden inny punkt POI parkingu
    const parkingPoiRadiusSource = map.getSource(
      PARKING_MARKER_RADIUS_SOURCE,
    ) as maplibregl.GeoJSONSource;

    parkingPoiRadiusSource.setData({
      type: 'FeatureCollection',
      features: markerCoors
        ? [
            circle([markerCoors.lng, markerCoors.lat], 20, {
              steps: 64,
              units: 'meters',
            }),
          ]
        : [],
    });
  }

  renderLineForMarker(
    map: maplibregl.Map,
    locations?: {
      fixedCoords?: LocationCoords;
      targetCoords?: LocationCoords;
    },
  ) {
    const lineSource = map.getSource(
      PARKING_POI_LINE_SOURCE,
    ) as maplibregl.GeoJSONSource;
    lineSource.setData(
      this._getLineGeoJson(locations?.fixedCoords, locations?.targetCoords),
    );
  }

  private async _prepareLayersForPoisWithClusters(map: maplibregl.Map) {
    // Ustawienie danych o punktach poi na mapie
    map.addSource(PARKING_POI_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Dodanie warstwy pojedynczych punktów POI
    map.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: PARKING_POI_SOURCE,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'parking-poi-icon',
        'icon-size': 0.3,
      },
    });

    // Dodanie warstwy klastrów zbiorczych dla punktów
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: PARKING_POI_SOURCE,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': environment.primaryColor,
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 2,
      },
    });

    // Dodanie warsztwy liczb określających liczbę punktów POI w danym klastrze
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: PARKING_POI_SOURCE,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 16,
      },
      paint: {
        'text-color': '#FFFFFF',
      },
    });
  }

  private _prepareLayersForPoisRadius(map: maplibregl.Map) {
    // Dodaj nowe źródło dla okręgów
    map.addSource(PARKING_MARKER_RADIUS_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    const MIN_ZOOM_TO_SHOW_RADIUS = 15;
    // Następnie dodaj warstwy korzystające z tego źródła
    map.addLayer({
      id: 'location-radius',
      type: 'fill',
      source: PARKING_MARKER_RADIUS_SOURCE,
      minzoom: MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'fill-color': '#FF0000',
        'fill-opacity': 0.15,
      },
    });

    map.addLayer({
      id: 'location-radius-outline',
      type: 'line',
      source: PARKING_MARKER_RADIUS_SOURCE,
      minzoom: MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'line-color': '#FF0000',
        'line-width': 1,
      },
    });
  }

  private _prepareLayersForPoiLines(map: maplibregl.Map) {
    // Dodanie danych o warstwie linii między markerem i punktem poi
    map.addSource(PARKING_POI_LINE_SOURCE, {
      type: 'geojson',
      data: this._getLineGeoJson(),
    });

    // Dodanie warstwy linii między markerem i punktem poi
    map.addLayer({
      id: 'line-layer',
      type: 'line',
      source: PARKING_POI_LINE_SOURCE,
      paint: {
        'line-color': environment.primaryColor,
        'line-width': 3,
        'line-dasharray': [2, 2],
      },
    });
  }

  private _getLineGeoJson(
    fixedCoords?: LocationCoords,
    targetCoords?: LocationCoords,
  ): any {
    let coordinates: any = [];
    if (fixedCoords && targetCoords) {
      coordinates = [
        [fixedCoords.lng, fixedCoords.lat],
        [targetCoords.lng, targetCoords.lat],
      ];
    }
    const lineGeoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: [],
        },
      ],
    };
    return lineGeoJson;
  }
}
