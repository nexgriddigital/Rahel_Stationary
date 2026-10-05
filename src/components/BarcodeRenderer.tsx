import React from 'react';
import { QrCodeRenderer, QrCodeRendererProps } from './QrCodeRenderer';

export { QrCodeRenderer };

export interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'QR';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  label?: string;
  size?: number;
}

/**
 * Modern QR Code & Label Renderer (backward-compatible adapter).
 * Renders high-density, sharp QR code for standard stationery labels.
 */
export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  displayValue = true,
  className = '',
  label,
  size,
  height
}) => {
  const effectiveSize = size || (height ? Math.max(70, Math.min(180, height * 2)) : 110);
  return (
    <QrCodeRenderer
      value={value}
      size={effectiveSize}
      displayValue={displayValue}
      label={label}
      className={className}
    />
  );
};
