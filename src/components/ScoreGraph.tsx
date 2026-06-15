import React from 'react';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme';

interface Props {
  scores: number[]; // oldest -> newest
  width: number;
  height?: number;
  color?: string; // colour of the most recent (latest) bar
}

export default function ScoreGraph({
  scores,
  width,
  height = 130,
  color,
}: Props) {
  const theme = useTheme();
  const axis = theme.chart.axis;
  const label = theme.chart.label;
  const muted = theme.chart.mutedBar;
  const activeColor = color ?? (theme.dark ? theme.colors.primary : '#ff9500');
  const padLeft = 26;
  const padBottom = 16;
  const padTop = 10;
  const plotW = Math.max(1, width - padLeft - 4);
  const plotH = Math.max(1, height - padBottom - padTop);
  const baseY = padTop + plotH;

  const maxV = Math.max(1, ...scores);
  const n = scores.length;
  const slot = plotW / Math.max(n, 1);
  const barW = Math.min(slot * 0.7, 22);

  return (
    <Svg width={width} height={height}>
      {/* baseline + max gridline */}
      <Line x1={padLeft} y1={baseY} x2={width - 4} y2={baseY} stroke={axis} strokeWidth={1} />
      <Line x1={padLeft} y1={padTop} x2={width - 4} y2={padTop} stroke={axis} strokeWidth={1} />
      <SvgText x={padLeft - 6} y={padTop + 4} fill={label} fontSize={10} textAnchor="end">
        {maxV}
      </SvgText>
      <SvgText x={padLeft - 6} y={baseY + 3} fill={label} fontSize={10} textAnchor="end">
        0
      </SvgText>

      {scores.map((v, i) => {
        const h = (v / maxV) * plotH;
        const x = padLeft + i * slot + (slot - barW) / 2;
        const y = baseY - h;
        const isLast = i === n - 1;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={Math.max(h, 1)}
            rx={2}
            fill={isLast ? activeColor : muted}
          />
        );
      })}
    </Svg>
  );
}
