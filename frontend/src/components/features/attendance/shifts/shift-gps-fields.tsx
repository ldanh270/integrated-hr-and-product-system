import { GpsMapPicker } from "@/components/features/attendance/gps-map-picker"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"

import { MapPin } from "lucide-react"
import type { Control } from "react-hook-form"

import type { ShiftFormValues } from "./shift-form-schema"

interface ShiftGpsFieldsProps {
  control: Control<ShiftFormValues>
  gpsLat: number | undefined
  gpsLng: number | undefined
  gpsRadiusMeters: number | undefined
  onMapLocationChange: (location: { lat: number; lng: number }) => void
}

export function ShiftGpsFields({
  control,
  gpsLat,
  gpsLng,
  gpsRadiusMeters,
  onMapLocationChange,
}: ShiftGpsFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
        <MapPin size={16} />
        <span>GPS Configuration (Optional)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="gpsLat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="10.7769"
                  className="h-11"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="gpsLng"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="106.7009"
                  className="h-11"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <GpsMapPicker
        lat={gpsLat}
        lng={gpsLng}
        radiusMeters={gpsRadiusMeters}
        onChange={onMapLocationChange}
      />

      <FormField
        control={control}
        name="gpsRadiusMeters"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Allowed Radius (meters)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g., 100, 200..."
                className="h-11"
                {...field}
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
