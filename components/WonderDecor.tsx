import { CSSProperties, useId } from 'react';

interface FireflyDotProps {
  size?: number;
  hue?: string;
  style?: CSSProperties;
  className?: string;
}

export function FireflyDot({
  size = 10,
  hue = '#F3C056',
  style,
  className = '',
}: FireflyDotProps) {
  const glowSize = size * 2.6;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: glowSize, height: glowSize, ...style }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${hue}88 0%, ${hue}22 42%, transparent 72%)`,
        }}
      />
      <span
        className="relative rounded-full bg-[#FFF3D2]"
        style={{ width: size * 0.42, height: size * 0.42 }}
      />
    </span>
  );
}

interface LampProps {
  size?: number;
  lit?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Lamp({
  size = 30,
  lit = true,
  style,
  className = '',
}: LampProps) {
  const flameId = useId();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className={className}
      style={{ width: size, height: size, ...style }}
    >
      <defs>
        <radialGradient id={flameId} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#FFE7A9" />
          <stop offset="58%" stopColor="#F2B85A" />
          <stop offset="100%" stopColor="#8E4412" />
        </radialGradient>
      </defs>
      {lit ? (
        <path
          d="M24 7c3.6 3.2 4.9 6 4.9 8.5 0 3.2-2.3 5.6-4.9 5.6s-4.9-2.4-4.9-5.6c0-2.5 1.3-5.3 4.9-8.5Z"
          fill={`url(#${flameId})`}
        />
      ) : null}
      <path
        d="M11 25.5c0-1.9 1.6-3.5 3.5-3.5h19c1.9 0 3.5 1.6 3.5 3.5 0 3.5-2.9 6.5-6.4 6.5H17.4c-3.5 0-6.4-3-6.4-6.5Z"
        fill="#8E4412"
      />
      <path
        d="M16 32h16l-2.8 6H18.8L16 32Z"
        fill="#5B2A0B"
      />
    </svg>
  );
}
