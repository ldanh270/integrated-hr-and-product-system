export interface RouteManifestEntry {
  name: string
  description?: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL"
  path: string
  authRequired: boolean
  permissions: string[] | null
}
