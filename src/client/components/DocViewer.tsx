import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import styles from './DocViewer.module.css'

interface Props {
  content: string
}

export default function DocViewer({ content }: Props) {
  const html = marked.parse(content, { async: false }) as string
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function handleClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href) return
      // Only handle relative doc links (no scheme, no leading slash)
      if (!href.startsWith('/') && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
        e.preventDefault()
        navigate(`/docs/${href}`)
      }
    }

    el.addEventListener('click', handleClick)
    return () => el.removeEventListener('click', handleClick)
  }, [navigate])

  return (
    <div
      ref={ref}
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
