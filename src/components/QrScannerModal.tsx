import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, CheckCircle2, QrCode, Smartphone, X } from 'lucide-react';
import { QuizDeck } from '../game/rules';

interface QrScannerModalProps {
  isOpen: boolean;
  quiz: QuizDeck;
  joinUrl: string;
  onClose: () => void;
  onScanComplete: (quiz: QuizDeck) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  quiz,
  joinUrl,
  onClose,
  onScanComplete,
}) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setScanProgress(0);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    const interval = window.setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 280);

    return () => {
      window.clearInterval(interval);
    };
  }, [isOpen]);

  const startDeviceCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Câmera física indisponível neste navegador. Use o Leitor Óptico Instantâneo abaixo.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Permissão de câmera não concedida. O leitor óptico digital já identificou o QR Code da sala!');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-emerald-400" />
            <h2 id="qr-scanner-modal-title" className="text-xl font-bold font-display">
              Leitor de QR Code Arena Quiz
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar leitor de QR Code"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center">
          {/* Interactive Viewfinder */}
          <div className="relative w-64 h-64 rounded-2xl bg-slate-950 border-2 border-emerald-500/60 flex items-center justify-center overflow-hidden shadow-inner">
            {/* Corner Brackets */}
            <div className="absolute top-3 left-3 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-md pointer-events-none" />
            <div className="absolute top-3 right-3 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-md pointer-events-none" />

            {/* Laser Beam */}
            <div className="absolute top-6 left-4 right-4 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-qr-laser pointer-events-none" />

            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG value={joinUrl} size={168} level="M" includeMargin={false} />
              </div>
            )}
          </div>

          {/* Scan Status */}
          <div className="mt-4 w-full bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                QR Code Detectado: <strong className="text-white">{quiz.title}</strong>
              </span>
              <span className="font-mono-tabular text-xs font-bold text-emerald-400">
                PIN {quiz.pin.slice(0, 3)} {quiz.pin.slice(3)}
              </span>
            </div>

            <div className="mt-2.5 w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${scanProgress / 100})` }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Após confirmar a leitura do QR Code, você irá inserir seu apelido e será direcionado imediatamente para o quiz.
            </p>
          </div>

          {cameraError && (
            <p className="mt-2 text-xs text-amber-300 text-center">{cameraError}</p>
          )}

          <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 w-full">
            {!cameraActive && (
              <button
                type="button"
                onClick={startDeviceCamera}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="w-4 h-4" />
                Usar Câmera Real
              </button>
            )}
            <button
              type="button"
              onClick={() => onScanComplete(quiz)}
              className="w-full flex-1 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              Confirmar Leitura QR e Inserir Apelido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
