import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
]

export default function BarcodeScanner({ onScan, onClose, title = 'Scan Barcode' }) {
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)
  const scannerId = 'barcode-scanner-container'

  const stopScanner = useCallback(() => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {})
      html5QrRef.current = null
    }
    setScanning(false)
  }, [])

  // Stop scanner on unmount
  useEffect(() => {
    return () => { stopScanner() }
  }, [stopScanner])

  const startScanner = useCallback(async () => {
    setError(null)
    setScanning(true)

    // Ensure container is in DOM first
    if (!document.getElementById(scannerId)) return

    try {
      const html5Qr = new Html5Qrcode(scannerId)
      html5QrRef.current = html5Qr

      await html5Qr.start(
        { facingMode: 'environment' }, // prefer rear camera
        {
          fps: 10,
          qrbox: { width: 280, height: 100 },
          aspectRatio: 1.0,
          formatsToSupport: SUPPORTED_FORMATS,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        (decodedText) => {
          // Success
          html5Qr.stop().then(() => {
            html5QrRef.current = null
            setScanning(false)
            onScan(decodedText)
          })
        },
        () => {
          // Ignore scan failures (no barcode found in frame)
        }
      )
      setScanning(true)
    } catch (err) {
      setScanning(false)
      const msg = err?.message || ''
      if (msg.includes('permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
        setError('Camera access denied — please enable camera permission or enter IMEI manually.')
      } else if (msg.includes('No device')) {
        setError('No camera found on this device.')
      } else {
        setError(`Camera error: ${msg}`)
      }
    }
  }, [onScan, scannerId])

  // Start camera once the component mounts and modal is visible
  useEffect(() => {
    const timer = setTimeout(startScanner, 100)
    return () => clearTimeout(timer)
  }, [startScanner])

  function handleClose() {
    stopScanner()
    onClose()
  }

  function handleRetry() {
    stopScanner()
    setError(null)
    setTimeout(startScanner, 100)
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-medium hover:bg-slate-600 transition-colors"
          onClick={handleClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Cancel
        </button>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Camera viewfinder */}
        <div className="relative">
          {/* Corner markers */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />

          {/* Scanner element — html5-qrcode mounts here */}
          <div
            id={scannerId}
            className="w-[280px] h-[180px] bg-slate-800 rounded-lg overflow-hidden"
          />
        </div>

        {/* Scanning line animation */}
        {scanning && !error && (
          <div className="absolute top-[calc(50%-90px)] w-[280px] h-0.5 bg-emerald-400 opacity-80 animate-pulse"
            style={{ animation: 'scanline 2s ease-in-out infinite' }}
          />
        )}

        {/* Status overlay */}
        <div className="mt-6 text-center">
          {scanning && !error && (
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium">Scanning for barcode…</span>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-900/50 border border-red-700 text-sm text-red-200 max-w-xs">
              <p className="font-medium mb-1">⚠️ Scan Error</p>
              <p className="text-red-300">{error}</p>
              <div className="flex gap-2 mt-3 justify-center">
                <button
                  className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                  onClick={handleRetry}
                >
                  Retry
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors"
                  onClick={handleClose}
                >
                  Use Manual Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-80px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(80px); opacity: 0; }
        }
        #${scannerId} video {
          border-radius: 8px;
          object-fit: cover;
        }
        #${scannerId} img {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
