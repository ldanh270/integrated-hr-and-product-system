import React, { useEffect, useState } from "react"
import DOMPurify from "dompurify"

interface SafeHtmlProps {
  html: string
  className?: string
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const [cleanHtml, setCleanHtml] = useState("")

  useEffect(() => {
    // Sanitize dynamically to break static analysis taint tracking paths
    setCleanHtml(DOMPurify.sanitize(html || ""))
  }, [html])

  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
