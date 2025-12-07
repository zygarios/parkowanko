import { Injectable } from '@angular/core';
import { environment } from '../../../../../../environments/environment.development';

export const PARKING_POI_SOURCE = 'parkingPoiSource';
export const PARKING_POI_RADIUS_SOURCE = 'parkingMarkerRadiusSource';
export const PARKING_POI_LINE_SOURCE = 'parkingPoiLineSource';

@Injectable({ providedIn: 'root' })
export class MapLayersService {
  async prepareLayersForPoisWithClusters(map: maplibregl.Map) {
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

  prepareLayersForPoisRadius(map: maplibregl.Map) {
    map.addSource(PARKING_POI_RADIUS_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    const MIN_ZOOM_TO_SHOW_RADIUS = 15;
    map.addLayer({
      id: 'location-radius',
      type: 'fill',
      source: PARKING_POI_RADIUS_SOURCE,
      minzoom: MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'fill-color': '#FF0000',
        'fill-opacity': 0.15,
      },
    });

    map.addLayer({
      id: 'location-radius-outline',
      type: 'line',
      source: PARKING_POI_RADIUS_SOURCE,
      minzoom: MIN_ZOOM_TO_SHOW_RADIUS,
      paint: {
        'line-color': '#FF0000',
        'line-width': 1,
      },
    });
  }

  prepareLayersForPoiLines(map: maplibregl.Map, lineGeoJson: any) {
    map.addSource(PARKING_POI_LINE_SOURCE, {
      type: 'geojson',
      data: lineGeoJson,
    });

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
}
