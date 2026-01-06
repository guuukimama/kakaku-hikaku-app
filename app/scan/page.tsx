"use client";

import { useEffect, useState, useRef } from "react";
// より制御しやすい Html5Qrcode に変更
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, AlertCircle, RefreshCw } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // 1. スキャナーの初期化
    if (!qrCodeRef.current) {
      qrCodeRef.current = new Html5Qrcode("reader");
    }

    const startScanner = async () => {
      try {
        setIsScanning(true);
        await qrCodeRef.current?.start(
          { facingMode: "environment" }, // 背面カメラを優先
          {
            fps: 20, // 処理速度をアップ
            qrbox: { width: 280, height: 160 }, // バーコードに最適な横長サイズ
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // スキャン成功時
            stopScanner();
            router.push(`/add-product?jan=${decodedText}`);
          },
          (errorMessage) => {
            // 待機中のエラーは無視
          }
        );
      } catch (err) {
        console.error(err);
        setError(
          "カメラの起動に失敗しました。ブラウザの設定でカメラを許可してください。"
        );
        setIsScanning(false);
      }
    };

    const stopScanner = async () => {
      if (qrCodeRef.current && qrCodeRef.current.isScanning) {
        await qrCodeRef.current.stop();
        await qrCodeRef.current.clear();
      }
    };

    startScanner();

    // クリーンアップ
    return () => {
      stopScanner();
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 text-white/50 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-black text-lg">バーコードスキャン</h1>
        <div className="w-10"></div> {/* バランス用 */}
      </div>

      <div className="max-w-md mx-auto">
        <div className="relative">
          {/* スキャンエリアの外枠デザイン */}
          <div
            id="reader"
            className="overflow-hidden rounded-[40px] border-2 border-white/10 bg-gray-900 shadow-2xl aspect-square"
          />

          {/* スキャン中のガイド線 */}
          {isScanning && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[160px] pointer-events-none">
              <div className="w-[280px] h-full mx-auto border-2 border-blue-500 rounded-lg relative overflow-hidden">
                <div className="absolute w-full h-[2px] bg-blue-500 top-0 animate-scan-line shadow-[0_0_15px_rgba(37,99,235,1)]" />
              </div>
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-2xl flex items-center gap-3 text-red-200">
            <AlertCircle size={20} />
            <p className="text-xs font-bold leading-relaxed">{error}</p>
          </div>
        ) : (
          <div className="mt-10 text-center animate-pulse">
            <p className="text-sm font-black text-blue-400 mb-2">SCANNING...</p>
            <p className="text-xs text-gray-500 font-bold">
              バーコードを青い枠内に合わせてください
            </p>
          </div>
        )}

        {/* 手動リロードボタン */}
        <button
          onClick={() => window.location.reload()}
          className="mt-8 mx-auto flex items-center gap-2 text-[10px] font-black text-gray-600 bg-white/5 px-4 py-2 rounded-full"
        >
          <RefreshCw size={12} />
          カメラが映らない場合はリロード
        </button>
      </div>

      <style jsx global>{`
        #reader video {
          object-fit: cover !important;
          border-radius: 40px !important;
        }
        @keyframes scan-line {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </main>
  );
}
