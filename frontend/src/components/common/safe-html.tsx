import React, { useEffect, useState } from "react"
import DOMPurify from "dompurify"

interface SafeHtmlProps {
  html: string
  className?: string
}

// Convert browser DOM nodes to React elements recursively
const domToReact = (node: Node, keyIndex: number): React.ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    // Map attributes to React-compatible names
    const props: any = { key: keyIndex }
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      let name = attr.name
      
      // Skip style attribute as a string (React expects an object)
      if (name === "style") continue
      
      // Map HTML class/for to React className/htmlFor
      if (name === "class") name = "className"
      if (name === "for") name = "htmlFor"
      
      // Skip event handlers to prevent potential script execution
      if (name.startsWith("on")) continue

      props[name] = attr.value
    }

    // Recursively parse children
    const children: React.ReactNode[] = []
    node.childNodes.forEach((child, index) => {
      const parsed = domToReact(child, index)
      if (parsed !== null) {
        children.push(parsed)
      }
    })

    return React.createElement(tagName, props, ...children)
  }

  return null
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const [reactNodes, setReactNodes] = useState<React.ReactNode[]>([])

  useEffect(() => {
    if (!html) {
      setReactNodes([])
      return
    }

    // 1. Sanitize raw HTML using DOMPurify
    const sanitized = DOMPurify.sanitize(html)

    // 2. Parse sanitized HTML string to a DOM document
    const parser = new DOMParser()
    const doc = parser.parseFromString(sanitized, "text/html")

    // 3. Convert all child nodes of doc.body into React elements
    const nodes: React.ReactNode[] = []
    doc.body.childNodes.forEach((child, index) => {
      const parsed = domToReact(child, index)
      if (parsed !== null) {
        nodes.push(parsed)
      }
    })

    setReactNodes(nodes)
  }, [html])

  return <div className={className}>{reactNodes}</div>
}
