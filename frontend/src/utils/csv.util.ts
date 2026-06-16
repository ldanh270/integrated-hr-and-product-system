/**
 * Formats headers for a CSV file.
 */
export function buildCSVHeaders(columns: { header: string }[]): string {
  return columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",") + "\n"
}

/**
 * Formats a chunk of data rows into a CSV string.
 */
export function buildCSVChunk<T>(
  data: T[],
  columns: { accessor: (item: T) => unknown }[],
): string {
  return (
    data
      .map((item) =>
        columns
          .map((col) => {
            const val = col.accessor(item)
            const str = val === null || val === undefined ? "" : String(val)
            return `"${str.replace(/"/g, '""')}"`
          })
          .join(","),
      )
      .join("\n") + "\n"
  )
}

/**
 * Combines CSV string chunks and triggers browser file download with UTF-8 BOM.
 */
export function downloadCSVFromChunks(chunks: string[], filename: string): void {
  const csvContent = chunks.join("")
  // Prepend UTF-8 BOM (\uFEFF) so Excel opens Vietnamese characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
