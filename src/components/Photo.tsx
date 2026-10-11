import { useState } from "react";

/**
 * Photo with shimmer loading + SVG fallback.
 * Shows a shimmer skeleton while loading; if the photo fails,
 * falls back to the provided SVG art (never a broken image).
 */
export default function Photo({ src, fallback, alt, className, style }: {
  src: string | null; fallback: string; alt: string; className?: string; style?: React.CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    // SVG fallback (data URI)
    return <img src={fallback} alt={alt} className={className} style={style} loading="lazy" />;
  }
  return (
    <span className={"ph-wrap" + (loaded ? " loaded" : "")} style={style}>
      {!loaded && <span className="ph-shimmer" aria-hidden />}
      <img
        src={src} alt={alt} className={className} loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </span>
  );
}
