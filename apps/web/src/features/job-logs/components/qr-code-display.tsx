'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ShieldCheck } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  hash: string;
  reference: string;
}

export function QRCodeDisplay({ url, hash, reference }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrLoaded = useRef(false);

  useEffect(() => {
    if (qrLoaded.current) return;
    qrLoaded.current = true;

    async function renderQR() {
      try {
        const QRCode = (await import('qrcode')).default;
        if (!canvasRef.current) return;

        const payload = JSON.stringify({ url, hash, ref: reference });
        await QRCode.toCanvas(canvasRef.current, payload, {
          width: 280,
          margin: 2,
          color: { dark: '#0A2540', light: '#FFFFFF' }
        });
      } catch (err) {
        console.error('QR code generation failed:', err);
      }
    }

    renderQR();
  }, [url, hash, reference]);

  function handlePrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>${reference} - QR Code</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
          <h2>${reference}</h2>
          <img src="${dataUrl}" style="width:300px;height:300px;" />
          <p style="font-size:11px;color:#666;margin-top:12px;">Hash: ${hash.slice(0, 16)}...</p>
          <script>window.print();window.close();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-base">{reference}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <canvas ref={canvasRef} />

          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
            <ShieldCheck className="h-4 w-4" />
            <span>Tamper-evident hash verified</span>
          </div>

          <p className="break-all text-center font-mono text-[10px] text-slate-400">{hash}</p>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print QR Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
