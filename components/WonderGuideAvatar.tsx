import { useId } from 'react';
import { WonderGuideId } from '@/lib/types';

type GuideExpression = 'calm' | 'curious' | 'wink';

interface WonderGuideAvatarProps {
  guide: WonderGuideId;
  size?: 'sm' | 'md' | 'lg';
  expression?: GuideExpression;
  floating?: boolean;
  glow?: boolean;
}

const SIZE_MAP = {
  sm: 92,
  md: 138,
  lg: 196,
} as const;

function GargiSvg({
  size,
  expression,
  floating,
  glow,
}: {
  size: number;
  expression: GuideExpression;
  floating: boolean;
  glow: boolean;
}) {
  const id = useId().replace(/:/g, '');

  const eye =
    expression === 'wink' ? (
      <path
        d="M0 0 q 6 -6 12 0"
        stroke="#0B2F2F"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        transform="translate(-6,0)"
      />
    ) : expression === 'curious' ? (
      <circle r="2.6" fill="#0B2F2F" />
    ) : (
      <path
        d="M-6 0 q 6 5 12 0"
        stroke="#0B2F2F"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    );

  return (
    <div
      className={floating ? 'wj-float-a' : ''}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg viewBox="0 0 200 220" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={`${id}-body`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#5BC9C2" />
            <stop offset="55%" stopColor="#2B8585" />
            <stop offset="100%" stopColor="#0F4A4A" />
          </radialGradient>
          <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8EEEE4" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#2B8585" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF3D2" stopOpacity="0.92" />
            <stop offset="60%" stopColor="#FFF3D2" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#FFF3D2" stopOpacity="0" />
          </radialGradient>
        </defs>
        {glow ? (
          <ellipse cx="100" cy="120" rx="100" ry="110" fill={`url(#${id}-glow)`} />
        ) : null}
        <path
          d="M100 18
             C 60 18, 32 70, 32 130
             C 32 180, 62 208, 100 208
             C 138 208, 168 180, 168 130
             C 168 70, 140 18, 100 18 Z"
          fill={`url(#${id}-body)`}
          stroke="rgba(10,40,40,0.25)"
          strokeWidth="1"
        />
        <ellipse cx="100" cy="140" rx="36" ry="42" fill={`url(#${id}-core)`} />
        <circle cx="74" cy="116" r="7" fill="#F2A3B0" opacity="0.35" />
        <circle cx="126" cy="116" r="7" fill="#F2A3B0" opacity="0.35" />
        <g transform="translate(82,102)">{eye}</g>
        <g transform="translate(118,102)">{eye}</g>
        <path
          d="M90 130 q 10 6 20 0"
          stroke="#0B2F2F"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M100 18 q 4 -14 14 -10 q 6 3 2 10"
          stroke="#F3C056"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="116" cy="10" r="2.6" fill="#F3C056" />
        <g transform="translate(155,60)" opacity="0.92">
          <path
            d="M0 -5 L 1.4 -1.4 L 5 0 L 1.4 1.4 L 0 5 L -1.4 1.4 L -5 0 L -1.4 -1.4 Z"
            fill="#F3C056"
          />
        </g>
      </svg>
    </div>
  );
}

function NachiSvg({
  size,
  expression,
  floating,
  glow,
}: {
  size: number;
  expression: GuideExpression;
  floating: boolean;
  glow: boolean;
}) {
  const id = useId().replace(/:/g, '');

  const eye =
    expression === 'wink' ? (
      <path
        d="M-6 0 q 6 -5 12 0"
        stroke="#3A1A0A"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    ) : expression === 'calm' ? (
      <path
        d="M-6 0 q 6 5 12 0"
        stroke="#3A1A0A"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    ) : (
      <circle r="2.8" fill="#3A1A0A" />
    );

  return (
    <div
      className={floating ? 'wj-float-b' : ''}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg viewBox="0 0 200 220" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={`${id}-body`} cx="40%" cy="60%" r="80%">
            <stop offset="0%" stopColor="#FFD07A" />
            <stop offset="55%" stopColor="#E89A2A" />
            <stop offset="100%" stopColor="#8E4412" />
          </radialGradient>
          <radialGradient id={`${id}-glow`} cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#FFD07A" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#E89A2A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF3D2" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#FFF3D2" stopOpacity="0" />
          </radialGradient>
        </defs>
        {glow ? (
          <ellipse cx="100" cy="130" rx="100" ry="105" fill={`url(#${id}-glow)`} />
        ) : null}
        <path
          d="M100 14
             C 60 40, 32 90, 38 140
             C 44 188, 76 212, 108 210
             C 146 208, 170 180, 168 140
             C 164 90, 150 50, 126 24
             C 118 14, 108 8, 100 14 Z"
          fill={`url(#${id}-body)`}
          stroke="rgba(60,20,5,0.3)"
          strokeWidth="1"
        />
        <ellipse cx="100" cy="155" rx="30" ry="36" fill={`url(#${id}-core)`} />
        <circle cx="74" cy="132" r="7" fill="#C34A3A" opacity="0.35" />
        <circle cx="126" cy="132" r="7" fill="#C34A3A" opacity="0.35" />
        <g transform="translate(82,118)">{eye}</g>
        <g transform="translate(118,118)">{eye}</g>
        <path
          d="M88 146 q 12 9 24 0"
          stroke="#3A1A0A"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="112" cy="6" r="2" fill="#F3C056" />
        <circle cx="128" cy="0" r="1.4" fill="#F3C056" opacity="0.8" />
        <circle cx="92" cy="2" r="1.2" fill="#F3C056" opacity="0.6" />
        <path
          d="M78 146 h44 v30 c0 4 -3 7 -7 7 H85 c-4 0 -7 -3 -7 -7 Z"
          fill="rgba(255,243,210,0.22)"
        />
        <path
          d="M90 143 h24 c6 0 10 4 10 10 v18 c0 4-2 6-6 6 h-24 c-5 0-8-3-8-8 v-16 c0-6 4-10 10-10Z"
          fill="#F6EEDD"
        />
        <path d="M114 143 v34" stroke="#D6C39A" strokeWidth="1.2" />
        <path d="M90 143 100 153" stroke="#D6C39A" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

export default function WonderGuideAvatar({
  guide,
  size = 'md',
  expression = 'curious',
  floating = true,
  glow = true,
}: WonderGuideAvatarProps) {
  const px = SIZE_MAP[size];

  if (guide === 'nachi') {
    return (
      <NachiSvg
        size={px}
        expression={expression}
        floating={floating}
        glow={glow}
      />
    );
  }

  return (
    <GargiSvg
      size={px}
      expression={expression}
      floating={floating}
      glow={glow}
    />
  );
}
