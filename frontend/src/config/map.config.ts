export const OSM_TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

export const OSM_TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors"

// Only used to render the picker before a shift-specific GPS point is selected.
export const MAP_INITIAL_CENTER = {
  lat: 10.7769,
  lng: 106.7009,
} as const

export const MAP_INITIAL_ZOOM = 15
export const SELECTED_GPS_ZOOM = 16
export const OSM_MAX_ZOOM = 19
export const GPS_COORDINATE_PRECISION = 6
