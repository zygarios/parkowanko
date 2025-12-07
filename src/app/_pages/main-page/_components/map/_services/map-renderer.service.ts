import { inject, Injectable } from '@angular/core';
import { circle } from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import { LocationCoords } from '../../../../../_types/location-coords.model';
import { Parking } from '../../../../../_types/parking.model';
import {
  MapLayersService,
  PARKING_POI_LINE_SOURCE,
  PARKING_POI_RADIUS_SOURCE,
  PARKING_POI_SOURCE,
} from './map-layers.service';
import { POLAND_BOUNDS, POLAND_MAX_BOUNDS } from './map.service';

@Injectable({ providedIn: 'root' })
export class MapRendererService {
  private _mapLayersService = inject(MapLayersService);

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

    const imageUrl = '/icons/parking-free-poi.png';

    const imageBitmap = await fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => createImageBitmap(blob));

    mapRef.addImage('parking-poi-icon', imageBitmap);

    return mapRef;
  }

  prepareMarker(): maplibregl.Marker {
    const el = document.createElement('div');
    el.className = 'marker';

    return new maplibregl.Marker({
      element: el,
      draggable: true,
    });
  }

  prepareLayersForRender(map: maplibregl.Map): void {
    this._mapLayersService.prepareLayersForPoisWithClusters(map);
    this._mapLayersService.prepareLayersForPoisRadius(map);
    this._mapLayersService.prepareLayersForPoiLines(map, this._getLineGeoJson());
  }

  renderPois(map: maplibregl.Map, parkingsList: Parking[]) {
    const parkingPoiSource = map.getSource(PARKING_POI_SOURCE) as maplibregl.GeoJSONSource;

    parkingPoiSource.setData({
      type: 'FeatureCollection',
      features: parkingsList.map((parking) => {
        const copiedParking = structuredClone(parking);
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parking.location.lng, parking.location.lat],
          },
          properties: {
            parking: copiedParking,
          },
        };
      }),
    });
  }

  renderRadiusForParkingPoi(map: maplibregl.Map, markerCoors?: LocationCoords) {
    const parkingPoiRadiusSource = map.getSource(
      PARKING_POI_RADIUS_SOURCE,
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
    const lineSource = map.getSource(PARKING_POI_LINE_SOURCE) as maplibregl.GeoJSONSource;
    lineSource.setData(this._getLineGeoJson(locations?.fixedCoords, locations?.targetCoords));
  }

  private _getLineGeoJson(fixedCoords?: LocationCoords, targetCoords?: LocationCoords): any {
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
