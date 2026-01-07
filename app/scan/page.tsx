"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;

    const stopScanner = async () => {
      if (qrCodeRef.current && qrCodeRef.current.isScanning) {
        try {
          await qrCodeRef.current.stop();
        } catch (e) {
          console.warn("Stop failed", e);
        }
      }
    };

    const startScanner = async () => {
      if (!isMounted) return;
      setIsInitializing(true);
      setError(null);

      try {
        if (!qrCodeRef.current) {
          qrCodeRef.current = new Html5Qrcode("reader");
        }

        // カメラ設定の最適解：デバイス指定をブラウザに委ねる
        const onScanSuccess = (decodedText: string) => {
          stopScanner();
          router.push(`/?search=${decodedText}`);
        };

        const config = {
          fps: 10, // 負荷を下げる
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        };

        // ★ ここが最大の修正ポイント：
        // environment(背面) を試すが、失敗しても user(前面) で即座にフォールバックする
        // それでもダメなら「デバイス指定なし」で呼ぶ
        try {
          await qrCodeRef.current.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            () => {}
          );
        } catch (e) {
          console.warn(
            "背面カメラが見つからないため、汎用的な設定で再開します"
          );
          // 最も成功率の高い「制約なし」での起動
          await qrCodeRef.current.start(
            { facingMode: "user" }, // PCなどの場合はこちらで動く
            config,
            onScanSuccess,
            () => {}
          );
        }

        if (isMounted) {
          setIsScanning(true);
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error("Fatal Scanner Error:", err);
        if (isMounted) {
          // エラーメッセージをより具体的に
          setError(
            "カメラにアクセスできません。ブラウザの設定でカメラが「許可」されているか確認し、ページをリロードしてください。"
          );
          setIsScanning(false);
          setIsInitializing(false);
        }
      }
    };

    // DOMが確実に構築されてから起動
    const timer = setTimeout(() => {
      startScanner();
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [router]);

  return (
    <main
      className="min-h-screen bg-black text-white p-4"
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="p-2 text-white/50">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-black text-lg">スキャン</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto relative">
        <div
          id="reader"
          className="overflow-hidden rounded-[40px] border-2 border-white/10 bg-gray-900 shadow-2xl aspect-square"
        />

        {isInitializing && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-[40px] z-10">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <p className="text-xs font-bold text-gray-400">カメラを起動中...</p>
          </div>
        )}

        {isScanning && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150px] pointer-events-none z-20">
            <div className="w-[250px] h-full mx-auto border-2 border-blue-500 rounded-lg relative">
              <div className="absolute w-full h-[2px] bg-blue-500 top-0 animate-scan-line" />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-2xl flex items-center gap-3 text-red-200">
            <AlertCircle size={20} />
            <p className="text-[11px] font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="mt-8 mx-auto flex items-center gap-2 text-[10px] font-black text-gray-500 bg-white/5 px-4 py-2 rounded-full active:bg-white/10 transition-colors"
        >
          <RefreshCw size={12} />
          カメラが映らない場合はリロード
        </button>
      </div>

      <style jsx global>{`
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
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
