/// The console's mark. Inline SVG rather than an asset so it inherits the
/// palette and needs no network request.
///
/// It sits on a gradient rather than the flat `primarySurface` square the first
/// pass used. The mark is the one element on screen with no job but identity,
/// so it is the one place a little depth costs nothing — and the gradient gives
/// the sidebar a top-left anchor the eye can find without reading.
export function BrandMark({
  size = 'md',
  onDark = false,
}: {
  readonly size?: 'md' | 'lg';
  /// For the deep-blue sign-in panel, where the blue gradient tile all but
  /// disappears into its background. A frosted white tile is the same shape
  /// with the contrast the other way round.
  readonly onDark?: boolean;
}) {
  const box = size === 'lg' ? 'size-14' : 'size-9';
  const glyph = size === 'lg' ? 'size-7' : 'size-5';

  return (
    <span
      className={`relative inline-flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] text-white transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-105 ${
        onDark
          ? 'bg-white/15 ring-1 ring-white/25 ring-inset backdrop-blur'
          : 'bg-gradient-to-br from-primary-soft to-primary-deep shadow-[0_2px_8px_rgb(30_64_175/0.28)]'
      }`}
    >
      {/* A highlight across the top-left corner, so the tile reads as a solid
          object catching light rather than as a coloured rectangle. */}
      <span
        aria-hidden="true"
        className="absolute -top-1/2 -left-1/2 size-full rotate-12 bg-white/20 blur-md"
      />
      <svg viewBox="0 0 24 24" className={`relative ${glyph}`} fill="none" aria-hidden="true">
        {/* A cross in a rounded shield: clinical without being a literal
            stethoscope, and legible at 20px. */}
        <path
          d="M12 3 4.5 5.8v5.4c0 4.3 3 8.2 7.5 9.6 4.5-1.4 7.5-5.3 7.5-9.6V5.8L12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 8.6v6.2M8.9 11.7h6.2"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Teleconsultation admin</span>
    </span>
  );
}
