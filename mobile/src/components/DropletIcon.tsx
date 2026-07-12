import React from 'react';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

const DROP_PATH = 'M7,0 C7,0 0,8 0,13 C0,16.87 3.13,20 7,20 C10.87,20 14,16.87 14,13 C14,8 7,0 7,0 Z';

interface Props {
  size?: number;
  fraction: number;
  color: string;
}

export function DropletIcon({ size = 20, fraction, color }: Props) {
  const clampedFraction = Math.min(1, Math.max(0, fraction));
  const fillHeight = 20 * clampedFraction;
  const clipId = `droplet-clip-${Math.round(clampedFraction * 1000)}`;

  return (
    <Svg width={size} height={(size * 20) / 14} viewBox="0 0 14 20">
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={0} y={20 - fillHeight} width={14} height={fillHeight} />
        </ClipPath>
      </Defs>
      <Path d={DROP_PATH} fill="none" stroke={color} strokeWidth={1.6} />
      <Path d={DROP_PATH} fill={color} clipPath={`url(#${clipId})`} />
    </Svg>
  );
}
