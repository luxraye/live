import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, ScanBarcode, Zap } from 'lucide-react'
import { BigButton, Modal } from './ui'

// Native BarcodeDetector (Chrome/Edge on Android tablets & desktop).
// Detects common clinical formats incl. Code128 (ISBT 128 uses Code128).
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
    }
  }
}

export function hasNativeScanner(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

export default function CameraScanner({
  open,
  title,
  onDetected,
  onClose,
  onFallback,
}: {
  open: boolean
  title: string
  onDetected: (code: string) => void
  onClose: () => void
  onFallback: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    if (!open) return
    let stream: MediaStream | null = null
    let raf = 0
    let cancelled = false
    setError(null)
    setStarting(true)

    async function start() {
      try {
        if (!hasNativeScanner()) {
          setError('This browser has no built-in barcode engine.')
          setStarting(false)
          return
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setStarting(false)

        const detector = new window.BarcodeDetector!({
          formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'data_matrix', 'codabar'],
        })
        const scan = async () => {
          if (cancelled || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0 && codes[0].rawValue) {
              if (navigator.vibrate) navigator.vibrate(60)
              onDetected(codes[0].rawValue)
              return
            }
          } catch { /* frame not ready; keep looping */ }
          raf = requestAnimationFrame(scan)
        }
        raf = requestAnimationFrame(scan)
      } catch {
        setError('Camera unavailable — permission denied or no camera on this device.')
        setStarting(false)
      }
    }
    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [open, onDetected])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <h3 className="flex items-center justify-center gap-2 text-base font-black text-inktext">
          <ScanBarcode size={20} className="text-cyanst" /> {title}
        </h3>
        <div className="relative mx-auto mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-cyanst/50 bg-black">
          {!error && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          )}
          {!error && (
            <>
              <div className="laser-line pointer-events-none absolute left-6 right-6 h-0.5 rounded bg-crimson shadow-[0_0_14px_3px_rgba(225,29,72,0.8)]" />
              <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-cyanst/40" />
            </>
          )}
          {starting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-cyanst">
              <Camera size={32} className="animate-pulse" />
              <p className="text-xs font-bold">Starting camera…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-amberwarn">
              <CameraOff size={32} />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-[11px] text-mute">
          Point at the Code 128 / ISBT 128 barcode. Detection is automatic.
        </p>
        <BigButton variant="cyan" className="mt-4 w-full" onClick={onFallback} id="simulate-scan-button">
          <Zap size={16} /> USE SIMULATED SCAN (PILOT DEMO)
        </BigButton>
      </div>
    </Modal>
  )
}
