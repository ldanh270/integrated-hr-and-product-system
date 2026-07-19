export const OSM_TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

export const OSM_TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors"

// FPT University Da Nang: initial view before a shift-specific GPS point is selected.
export const MAP_INITIAL_CENTER = {
  lat: 15.96751,
  lng: 108.26052,
} as const

export const MAP_INITIAL_ZOOM = 15
export const SELECTED_GPS_ZOOM = 16
export const OSM_MAX_ZOOM = 19
export const GPS_COORDINATE_PRECISION = 6
