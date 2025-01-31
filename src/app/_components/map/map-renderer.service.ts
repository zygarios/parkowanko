import { Injectable } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { environment } from '../../../environments/environment.development';
import { LocationCoords } from '../../_types/location-coords.model';

@Injectable({
  providedIn: 'root',
})
export class MapRendererService {
  prepareMarker(): maplibregl.Marker {
    // Ustawienie warstwy markera pod przyszłe wykorzystanie
    const el = document.createElement('div');
    el.className = 'marker';

    return new maplibregl.Marker({
      element: el,
    });
  }

  async preparePoiLayers(map: maplibregl.Map, sourceId: string): Promise<void> {
    // Ustawienie danych o punktach poi na mapie
    map.addSource(sourceId, {
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
    const image = await map.loadImage(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Cyprus_road_sign_parking.svg/212px-Cyprus_road_sign_parking.svg.png?20130416124154',
    );

    map.addImage('parking-poi-icon', image.data);
    map.addSource('point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
          } as any,
        ],
      },
    });

    map.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'parking-poi-icon',
        'icon-size': 0.1,
      },
    });

    // Dodanie warstwy klastrów zbiorczych dla punktów
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: sourceId,
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
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Roboto Regular'],
        'text-size': 16,
      },
      paint: {
        'text-color': '#FFFFFF',
      },
    });

    // Dodanie danych o warstwie linii między markerem i punktem poi
    map.addSource('line-source', {
      type: 'geojson',
      data: this.getLineGeoJson(),
    });

    // Dodanie warstwy linii między markerem i punktem poi
    map.addLayer({
      id: 'line-layer',
      type: 'line',
      source: 'line-source',
      paint: {
        'line-color': environment.primaryColor,
        'line-width': 3,
        'line-dasharray': [2, 2],
      },
    });
  }

  getLineGeoJson(
    fixedPoiCoords?: LocationCoords,
    markerCoords?: LocationCoords,
  ): any {
    let coordinates: any = [];
    if (fixedPoiCoords && markerCoords) {
      coordinates = [
        [fixedPoiCoords.lng, fixedPoiCoords.lat],
        [markerCoords.lng, markerCoords.lat],
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
