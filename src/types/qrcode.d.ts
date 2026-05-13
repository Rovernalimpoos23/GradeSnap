declare module 'qrcode' {
  interface QRCodeToDataURLOptions {
    version?: number
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H'
    margin?: number
    scale?: number
    width?: number
    color?: {
      dark?: string
      light?: string
    }
    type?: 'image/png' | 'image/jpeg' | 'image/webp'
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
  export function toDataURL(
    text: string,
    options: QRCodeToDataURLOptions,
    callback: (error: Error | null | undefined, url: string) => void
  ): void
  export function toString(text: string, options?: { type?: string }): Promise<string>
}
