'use client';

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
}

export function Marquee({ children, className }: MarqueeProps) {
  return (
    <div
      className={`group relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className ?? ''}`}
    >
      <div className="flex w-max overflow-hidden">
        <div className="flex shrink-0 gap-3 pr-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {children}
        </div>
        <div
          className="flex shrink-0 gap-3 pr-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
