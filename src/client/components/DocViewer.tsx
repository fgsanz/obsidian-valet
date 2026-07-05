import { useEffect, useRef, useState } from 'react'
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
  // The full-size image shown in the lightbox, or null when closed.
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function handleClick(e: MouseEvent) {
      // Click an image → open it full-size in the lightbox.
      const img = (e.target as HTMLElement).closest('img')
      if (img) {
        setLightbox({ src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' })
        return
      }

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

  // External links open in a new browser tab; rel keeps the new tab from accessing this one.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.querySelectorAll('a[href]').forEach((a) => {
      if (/^https?:\/\//.test(a.getAttribute('href') || '')) {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      }
    })
  }, [html])

  // Close the lightbox with Escape.
  useEffect(() => {
    if (!lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  return (
    <>
      <div ref={ref} className={styles.content} dangerouslySetInnerHTML={{ __html: html }} />

      {lightbox && (
        <div
          className={styles.lightbox}
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt || 'Image preview'}
        >
          <img className={styles.lightboxImg} src={lightbox.src} alt={lightbox.alt} />
        </div>
      )}
    </>
  )
}
