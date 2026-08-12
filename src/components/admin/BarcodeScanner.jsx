import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, AlertCircle } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose, title = 'Scan IMEI / Barcode' }) {
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const html5QrRef = useRef(null)
  const scannerId = 'barcode-scanner-container'

  const stopScanner = useCallback(() => {
    if (html5QrRef.current && typeof html5QrRef.current.stop === 'function') {
      try {
        html5QrRef.current.stop().then(() => { html5QrRef.current = null }).catch(() => { html5QrRef.current = null })
      } catch (e) {
        html5QrRef.current = null
      }
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => { stopScanner() }
  }, [stopScanner])

  const startScanner = useCallback(async () => {
    setError(null)
    const el = document.getElementById(scannerId)
    if (!el) return

    try {
      // Dynamic import to avoid SSR/build issues
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5Qr = new Html5Qrcode(scannerId)
      html5QrRef.current = html5Qr

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 100 },
          aspectRatio: 1.0,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        (decodedText) => {
          // Success callback
          try { html5Qr.stop() } catch (e) {}
          html5QrRef.current = null
          setScanning(false)
          onScan(decodedText)
        },
        () => {} // ignore per-frame failures
      )
      setScanning(true)
    } catch (err) {
      setScanning(false)
      const msg = (err && (err.message || err.toString())) || ''
      const lower = msg.toLowerCase()
      if (lower.includes('permission') || lower.includes('denied') || lower.includes('notallowed')) {
        setError('Camera permission denied. Please allow camera access, or enter the IMEI manually below.')
      } else if (lower.includes('notfound') || lower.includes('no device') || lower.includes('Requested device not found')) {
        setError('No camera found on this device. Use manual IMEI entry below.')
      } else if (lower.includes('secure') || lower.includes('https')) {
        setError('Camera requires HTTPS. Use manual IMEI entry below.')
      } else {
        setError('Camera error: ' + msg + '. You can enter the IMEI manually below.')
      }
    }
  }, [onScan])

  function manualSubmit(e) {
    e.preventDefault()
    const input = e.target.imei.value.trim()
    if (input) onScan(input)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-sec-bg border border-border rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-neon-green" />
            <h3 className="font-semibold text-main-text">{title}</h3>
          </div>
          <button onClick={() => { stopScanner(); onClose() }} className="text-muted-text hover:text-main-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div id={scannerId} className="aspect-square bg-black rounded-xl overflow-hidden relative" style={{ minHeight: 280 }}>
            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-text text-sm">
                <button onClick={startScanner} className="btn-primary text-sm py-2 px-4">
                  Start camera
                </button>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                <div>
                  <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
                  <p className="text-danger text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={manualSubmit} className="space-y-2">
            <label className="block text-xs text-sec-text">Or enter IMEI manually:</label>
            <div className="flex gap-2">
              <input
                name="imei"
                type="text"
                placeholder="15-16 digit IMEI"
                className="input flex-1 font-mono"
                autoComplete="off"
                autoFocus
              />
              <button type="submit" className="btn-primary px-4">Use</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
