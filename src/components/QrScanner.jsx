"use client";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function QRScannerModal({ onScan, onClose }) {
  const readerId = "qr-reader";
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const module = await import("html5-qrcode");
        const { Html5Qrcode, Html5QrcodeScanner } = module;

        let cameras = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (e) {
          console.warn("Could not enumerate cameras:", e);
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          rememberLastUsedCamera: true,
        };

        if (cameras && cameras.length > 0) {
          const preferred = cameras.find(c => /back|rear|environment|rear camera/i.test(c.label)) || cameras[0];
          const cameraId = preferred.id;
          const html5Qr = new Html5Qrcode(readerId);
          scannerRef.current = html5Qr;
          await html5Qr.start(
            cameraId,
            config,
            (decodedText, decodedResult) => {
              try {
                onScan(decodedText);
              } catch (e) {
                console.error("onScan handler error", e);
              }
              html5Qr.stop().catch(()=>{});
              onClose && onClose();
            },
            (errorMessage) => {
              // ignore frequent "QR not found" messages
            }
          );
        } else {
          const scanner = new Html5QrcodeScanner(readerId, config, false);
          scannerRef.current = scanner;
          await scanner.render(
            (result) => {
              onScan(result);
              try { scanner.clear(); } catch(e){}
              onClose && onClose();
            },
            (error) => {
              console.warn("Scanner fallback error:", error);
            }
          );
        }
      } catch (err) {
        console.error("Failed to init QR scanner:", err);
        toast.error("Failed to initialize QR scanner");
        onClose && onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    start();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try {
          if (typeof scannerRef.current.stop === "function") {
            scannerRef.current.stop().catch(()=>{});
          } else if (typeof scannerRef.current.clear === "function") {
            scannerRef.current.clear().catch(()=>{});
          }
        } catch (e) {}
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl p-4">
        <div className="flex justify-end">
          <button onClick={() => { onClose && onClose(); }} className="p-2 rounded-full bg-gray-200">Close</button>
        </div>
        <div id={readerId} style={{ width: "100%", height: 400 }} />
        {loading && <div className="text-center mt-2">Initializing camera...</div>}
      </div>
    </div>
  );
}
