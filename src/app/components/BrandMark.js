/**
 * BrandMark — the Premarket logo mark.
 *
 * The Premarket logo is a 2×2 grid of rounded squares. This is the symbol
 * Premarket leans on to express the brand without relying on the wordmark.
 *
 * Use it as:
 *   - A standalone logo mark in nav, footer, hero accents
 *   - Section ornaments above section headings
 *   - Loading placeholders (with the `loading` prop, the squares fade in/out)
 *
 * Props:
 *   size      — pixel size of the square. Default 28.
 *   color     — fill color of the squares. Default #e48900 (brand orange).
 *   className — extra classes for the wrapping svg.
 *   loading   — when true, the squares pulse one-after-the-other (preloader).
 */

export default function BrandMark({
  size = 28,
  color = '#e48900',
  className = '',
  loading = false,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="40"
        height="40"
        rx="9"
        fill={color}
        className={loading ? 'brandmark-pulse-1' : ''}
      />
      <rect
        x="54"
        y="6"
        width="40"
        height="40"
        rx="9"
        fill={color}
        className={loading ? 'brandmark-pulse-2' : ''}
      />
      <rect
        x="6"
        y="54"
        width="40"
        height="40"
        rx="9"
        fill={color}
        className={loading ? 'brandmark-pulse-3' : ''}
      />
      <rect
        x="54"
        y="54"
        width="40"
        height="40"
        rx="9"
        fill={color}
        className={loading ? 'brandmark-pulse-4' : ''}
      />
      {loading && (
        <style>{`
          @keyframes brandmark-pulse {
            0%, 100% { opacity: 0.25; }
            50% { opacity: 1; }
          }
          .brandmark-pulse-1 { animation: brandmark-pulse 1.4s ease-in-out infinite; animation-delay: 0s; }
          .brandmark-pulse-2 { animation: brandmark-pulse 1.4s ease-in-out infinite; animation-delay: 0.15s; }
          .brandmark-pulse-3 { animation: brandmark-pulse 1.4s ease-in-out infinite; animation-delay: 0.45s; }
          .brandmark-pulse-4 { animation: brandmark-pulse 1.4s ease-in-out infinite; animation-delay: 0.3s; }
        `}</style>
      )}
    </svg>
  );
}

/**
 * BrandMarkLogo — the BrandMark + "Premarket" wordmark in slate-900.
 *
 * Use this in the Nav and Footer instead of the raster logo.png so the
 * brand scales crisply at any DPI.
 */
export function BrandMarkLogo({ size = 28, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size} />
      <span
        className="font-bold tracking-tight text-slate-900"
        style={{ fontSize: size * 0.95, lineHeight: 1 }}
      >
        Premarket
      </span>
    </span>
  );
}
