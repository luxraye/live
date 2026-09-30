import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import Svg, { Rect } from 'react-native-svg';

interface DonorQrCodeProps {
  value: string;
  size?: number;
  color?: string;
  bgColor?: string;
}

export function DonorQrCode({
  value,
  size = 54,
  color = '#F0F6FF',
  bgColor = 'transparent',
}: DonorQrCodeProps) {
  const { count, rects, cellSize } = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'BLOODCHAIN:DONOR', { errorCorrectionLevel: 'M' });
      const modules = qr.modules;
      const count = modules.size;
      const cellSize = size / count;
      const rects: { x: number; y: number }[] = [];

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (modules.get(r, c)) {
            rects.push({ x: c * cellSize, y: r * cellSize });
          }
        }
      }
      return { count, rects, cellSize };
    } catch {
      return { count: 0, rects: [], cellSize: 0 };
    }
  }, [value, size]);

  if (!rects.length) return null;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {bgColor !== 'transparent' && <Rect x={0} y={0} width={size} height={size} fill={bgColor} />}
      {rects.map((pt, i) => (
        <Rect key={i} x={pt.x} y={pt.y} width={cellSize} height={cellSize} fill={color} />
      ))}
    </Svg>
  );
}
