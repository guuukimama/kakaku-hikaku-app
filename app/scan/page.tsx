"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter, useSearchParams } from "next/navigation"; // useSearchParams を追加
import { ArrowLeft, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 追加
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

        // ★ 修正：スキャン成功時の処理
        const onScanSuccess = (decodedText: string) => {
          stopScanner();

          // modeパラメータを確認
          const mode = searchParams.get("mode");

          if (mode === "add") {
            // 商品登録画面から来た場合：add-product ページへ戻る
            router.push(`/add-product?jan=${decodedText}`);
          } else {
            // それ以外（TOPなど）から来た場合：検索結果としてTOPへ
            router.push(`/?search=${decodedText}`);
          }
        };

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        };

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
          await qrCodeRef.current.start(
            { facingMode: "user" },
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
          setError(
            "カメラにアクセスできません。設定を確認し、リロードしてください。"
          );
          setIsScanning(false);
          setIsInitializing(false);
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [router, searchParams]); // searchParams を依存配列に追加

  // --- 以下、JSX部分は変更なし ---
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
      {/* ...省略（既存のUIコード）... */}
      <div className="max-w-md mx-auto relative">
        <div
          id="reader"
          className="overflow-hidden rounded-[40px] border-2 border-white/10 bg-gray-900 shadow-2xl aspect-square"
        />
        {/* ...（中略）... */}
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
