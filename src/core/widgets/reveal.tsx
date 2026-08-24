import type { ElementType, ReactNode } from 'react';

/// An entrance animation for a block of a page.
///
/// Deliberately **not** a client component and deliberately not
/// intersection-observed. Everything in this console is server-rendered above
/// the fold on a desktop screen, so "animate when scrolled into view" would buy
/// nothing and cost a hydration boundary around half the markup. A CSS
/// animation starts the moment the element is painted, which is exactly when
/// this wants to start.
///
/// The `delay` is the whole point: giving each block on a screen a slightly
/// later start turns a page that appears all at once into a page that assembles
/// in reading order, which is how a reviewer reads it anyway.
export function Reveal({
  children,
  delay = 0,
  variant = 'rise',
  as: Tag = 'div',
  className = '',
}: {
  readonly children: ReactNode;
  /// Milliseconds. Keep the spread across one screen under ~250ms — past that
  /// the last block reads as slow rather than as sequenced.
  readonly delay?: number;
  readonly variant?: 'rise' | 'fade' | 'scale' | 'drop' | 'slide';
  readonly as?: ElementType;
  readonly className?: string;
}) {
  const ANIMATIONS = {
    rise: 'animate-rise',
    fade: 'animate-fade',
    scale: 'animate-scale-in',
    drop: 'animate-drop',
    slide: 'animate-slide-in',
  } as const;

  return (
    <Tag
      className={`${ANIMATIONS[variant]} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
