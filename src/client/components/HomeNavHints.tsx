import styles from './HomeNavHints.module.css'

interface Props {
  /** Viewport x of the centre of the "Vaults" nav link. */
  vaultsX: number
  /** Viewport x of the centre of the "Metadata" nav link. */
  opsX: number
}

// Arrows are drawn in a 48×60 box. Tail = where the line starts (near the label); tip = arrowhead.

/** Sweeps up-right, bowing to the right (tail bottom-left, tip top-right). */
function ArrowRight() {
  return (
    <svg className={styles.arrow} viewBox="0 0 48 60" aria-hidden>
      <path d="M8 54 C 30 50 36 30 40 8 M32 17 L40 8 L44 18" />
    </svg>
  )
}

/** Roughly straight up (tail bottom-centre, tip top-centre). */
function ArrowUp() {
  return (
    <svg className={styles.arrow} viewBox="0 0 48 60" aria-hidden>
      <path d="M24 54 C 21 40 27 24 24 8 M16 16 L24 8 L32 16" />
    </svg>
  )
}

/** Sweeps up-left, bowing to the left (tail bottom-right, tip top-left) — a mirror of ArrowRight. */
function ArrowLeft() {
  return (
    <svg className={styles.arrow} viewBox="0 0 48 60" aria-hidden>
      <path d="M40 54 C 18 50 12 30 8 8 M16 17 L8 8 L4 18" />
    </svg>
  )
}

/**
 * Playful, hand-written annotations under the top nav, pointing at the steps a first-time user
 * takes: 1 → Vaults, 2 & 3 → Metadata. Each hint is anchored to the measured centre of its nav
 * link (passed in), so they track the real menu entries as the window resizes. Arrows 1 and 3 bow
 * outward and their labels hang to the lower-left / lower-right of the arrow's tail. Colours come
 * from theme tokens, so it reads on both light and dark themes.
 */
export default function HomeNavHints({ vaultsX, opsX }: Props) {
  return (
    <div className={styles.hints} aria-hidden>
      <div className={`${styles.hint} ${styles.hint1}`} style={{ left: vaultsX }}>
        <ArrowRight />
        <span className={styles.label}>
          <span className={styles.num}>1.</span> add a vault
        </span>
      </div>

      <div className={`${styles.hint} ${styles.hint2}`} style={{ left: opsX }}>
        <ArrowUp />
        <span className={styles.label}>
          <span className={styles.num}>2.</span> filter notes
        </span>
      </div>

      <div className={`${styles.hint} ${styles.hint3}`} style={{ left: opsX }}>
        <ArrowLeft />
        <span className={styles.label}>
          <span className={styles.num}>3.</span> apply changes
        </span>
      </div>
    </div>
  )
}
