import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, AlertCircle } from 'lucide-react'

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
]

export default function BarcodeScanner({ onScan, onClose, title = 'Scan IMEI / Barcode' }) {
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const html5QrRef = useRef(null)
  const scannerId = 'barcode-scanner-container'

  const stopScanner = useCallback(() => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().then(() => {
        html5QrRef.current = null
      }).catch(() => { html5QrRef.current = null })
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => { stopScanner() }
  }, [stopScanner])

  const startScanner = useCallback(async () => {
    setError(null)
    if (!document.getElementById(scannerId)) return

    try {
      const html5Qr = new Html5Qrcode(scannerId)
      html5QrRef.current = html5Qr

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 100 },
          aspectRatio: 1.0,
          formatsToSupport: SUPPORTED_FORMATS,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        (decodedText) => {
          html5Qr.stop().then(() => {
            html5QrRef.current = null
            setScanning(false)
            onScan(decodedText)
          }).catch(() => {
            html5QrRef.current = null
            setScanning(false)
            onScan(decodedText)
          })
        },
        () => {}
      )
      setScanning(true)
    } catch (err) {
      setScanning(false)
      const msg = err?.message || err?.toString() || ''
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
        setError('Camera permission denied. Please allow camera access and try again, or enter the IMEI manually.')
      } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no device')) {
        setError('No camera found on this device. Use manual IMEI entry.')
      } else {
        setError('Camera error: ' + msg)
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
