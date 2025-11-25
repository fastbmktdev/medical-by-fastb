/**
 * Type declarations for qrcode module
 */

declare module 'qrcode' {
  export interface QRCodeOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp' | 'svg' | 'utf8';
    quality?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    width?: number;
  }

  export function toDataURL(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>;

  export function toBuffer(
    text: string,
    options?: QRCodeOptions
  ): Promise<Buffer>;

  export function toString(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>;
}

