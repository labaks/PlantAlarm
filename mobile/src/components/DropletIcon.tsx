import React from 'react';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

const DROP_PATH = 'M7,0 C7,0 0,8 0,13 C0,16.87 3.13,20 7,20 C10.87,20 14,16.87 14,13 C14,8 7,0 7,0 Z';
const DROP_WIDTH = 14;
const DROP_HEIGHT = 20;
const STROKE_WIDTH = 1.6;
// Half the stroke sits outside the path's own bounds (SVG strokes are centered on the
// outline), so the viewBox needs this much padding on every side or that half gets clipped.
const PAD = STROKE_WIDTH / 2;

interface Props {
  size?: number;
  fraction: number;
  color: string;
}

export function DropletIcon({ size = 20, fraction, color }: Props) {
  const clampedFraction = Math.min(1, Math.max(0, fraction));
  const fillHeight = DROP_HEIGHT * clampedFraction;
  const clipId = `droplet-clip-${Math.round(clampedFraction * 1000)}`;
  const viewWidth = DROP_WIDTH + STROKE_WIDTH;
  const viewHeight = DROP_HEIGHT + STROKE_WIDTH;

  return (
    <Svg
      width={size}
      height={(size * viewHeight) / viewWidth}
      viewBox={`${-PAD} ${-PAD} ${viewWidth} ${viewHeight}`}
    >
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={0} y={DROP_HEIGHT - fillHeight} width={DROP_WIDTH} height={fillHeight} />
        </ClipPath>
      </Defs>
      <Path d={DROP_PATH} fill="none" stroke={color} strokeWidth={STROKE_WIDTH} />
      <Path d={DROP_PATH} fill={color} clipPath={`url(#${clipId})`} />
    </Svg>
  );
}
