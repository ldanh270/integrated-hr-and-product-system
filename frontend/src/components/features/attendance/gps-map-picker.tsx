import {
  DEFAULT_GPS_CENTER,
  DEFAULT_GPS_ZOOM,
  GPS_COORDINATE_PRECISION,
  OSM_MAX_ZOOM,
  OSM_TILE_ATTRIBUTION,
  OSM_TILE_LAYER_URL,
  SELECTED_GPS_ZOOM,
} from "@/config/map.config"
import { cn } from "@/lib/utils"

import { useEffect, useRef, useState } from "react"

import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { LocateFixed, MapPin } from "lucide-react"

interface GpsMapPickerProps {
  lat?: number
  lng?: number
  radiusMeters?: number
  onChange: (location: { lat: number; lng: number }) => void
  className?: string
}

const PICKER_MARKER_ICON = L.divIcon({
  className: "gps-map-pin",
  html: "<span></span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function roundCoordinate(value: number) {
  return Number(value.toFixed(GPS_COORDINATE_PRECISION))
}

function getMapCenter(lat?: number, lng?: number) {
  return lat != null && lng != null ? { lat, lng } : DEFAULT_GPS_CENTER
}

export function GpsMapPicker({ lat, lng, radiusMeters, onChange, className }: GpsMapPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const initialCenterRef = useRef(getMapCenter(lat, lng))
  const initialZoomRef = useRef(lat != null && lng != null ? SELECTED_GPS_ZOOM : DEFAULT_GPS_ZOOM)
  const onChangeRef = useRef(onChange)
  const [isLocating, setIsLocating] = useState(false)
  const canUseGeolocation = typeof navigator !== "undefined" && "geolocation" in navigator

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const mapElement = mapElementRef.current
    if (!mapElement || mapRef.current) return

    const map = L.map(mapElement, {
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      zoomControl: true,
    })

    L.tileLayer(OSM_TILE_LAYER_URL, {
      attribution: OSM_TILE_ATTRIBUTION,
      maxZoom: OSM_MAX_ZOOM,
    }).addTo(map)

    map.on("click", (event) => {
      onChangeRef.current({
        lat: roundCoordinate(event.latlng.lat),
        lng: roundCoordinate(event.latlng.lng),
      })
    })

    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || lat == null || lng == null) return

    const point = L.latLng(lat, lng)

    if (!markerRef.current) {
      markerRef.current = L.marker(point, { icon: PICKER_MARKER_ICON }).addTo(map)
    } else {
      markerRef.current.setLatLng(point)
    }

    if (radiusMeters && radiusMeters > 0) {
      if (!circleRef.current) {
        circleRef.current = L.circle(point, {
          className: "gps-map-radius",
          radius: radiusMeters,
        }).addTo(map)
      } else {
        circleRef.current.setLatLng(point)
        circleRef.current.setRadius(radiusMeters)
      }
    } else if (circleRef.current) {
      circleRef.current.remove()
      circleRef.current = null
    }

    map.setView(point, Math.max(map.getZoom(), SELECTED_GPS_ZOOM))
  }, [lat, lng, radiusMeters])

  const useCurrentLocation = () => {
    if (!canUseGeolocation) return

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        onChangeRef.current({
          lat: roundCoordinate(position.coords.latitude),
          lng: roundCoordinate(position.coords.longitude),
        })
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true },
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Click vào bản đồ để chọn vị trí GPS cho ca làm.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          onClick={useCurrentLocation}
          disabled={isLocating || !canUseGeolocation}
        >
          <LocateFixed className="h-3.5 w-3.5 text-primary" />
          {isLocating ? "Đang định vị..." : "Vị trí hiện tại"}
        </button>
      </div>
      <div className="gps-map-picker overflow-hidden rounded-xl border border-border bg-muted/30">
        <div ref={mapElementRef} className="h-64 w-full" />
      </div>
    </div>
  )
}
