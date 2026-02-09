export let mapConfigData = {
  POLAND_BOUNDS: [14, 48, 24.5, 56] as [number, number, number, number],
  POLAND_MAX_BOUNDS: [0, 0, 0, 0] as [number, number, number, number],
  PARKING_POI_RADIUS_BOUND: 30,
  MAX_DISTANCE_TO_EDIT_LOCATION_METERS: 50,
  CLOSE_ZOOM: 17,
  FAR_ZOOM: 13,
  FLY_SPEED: 2,
  MAX_DISTANCE_TO_NEAREST_PARKING_KM: 10,
  MIN_ZOOM_TO_SHOW_RADIUS: 15,
  MAP_LAST_CENTER_KEY: 'par_map_last_center',
  MAP_LAST_ZOOM_KEY: 'par_map_last_zoom',
};
mapConfigData.POLAND_MAX_BOUNDS = [
  mapConfigData.POLAND_BOUNDS[0] - 3,
  mapConfigData.POLAND_BOUNDS[1] - 3,
  mapConfigData.POLAND_BOUNDS[2] + 3,
  mapConfigData.POLAND_BOUNDS[3] + 3,
] as [number, number, number, number];
