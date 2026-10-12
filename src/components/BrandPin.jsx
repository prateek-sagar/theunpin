import { useEffect, useRef, useState } from "react";

/* BrandPin — the theUnpin pin mark, with two states:
     rest  — upright, tight and compact;
     hover — the pin lifts and tilts about 12°, and a thin teal ring expands
             from its tip, then settles at the new angle.

   The change is a pure CSS transition between two transforms, toggled by the
   parent link's :hover / :focus-visible (see .brand-pin in styles.css), so the
   motion is reversible and interruptible with no JS player. On touch devices
   (no hover) an IntersectionObserver reveals the unpinned state once when the
   mark scrolls into view, then disconnects. Geometry and colours at rest are
   identical to the original mark; the ring is invisible at rest. */

function useTouchReveal(ref) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return undefined;
    if (!window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return revealed;
}

export default function BrandPin() {
  const ref = useRef(null);
  const revealed = useTouchReveal(ref);

  return (
    <svg
      ref={ref}
      className={`brand-mark${revealed ? " is-touch-revealed" : ""}`}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <circle className="brand-pin-ring" cx="16" cy="25" r="4" />
      <g className="brand-pin">
        <path d="M16 25V13" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="16" cy="9.5" r="3.4" />
        <path d="M8.5 20.5h15" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      </g>
    </svg>
  );
}
