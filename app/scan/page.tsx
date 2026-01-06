"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, AlertCircle } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // 1. マウント時にスキャナーを生成
    // id="reader" の要素が存在することを確認してから実行
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          // スキャン成功
          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
          }
          router.push(`/add-product?jan=${decodedText}`);
        },
        (errorMessage) => {
          // スキャン待機中の細かいエラーは無視
        }
      );
    }

    // 2. クリーンアップ処理
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => {
          console.warn("Scanner clear failed:", err);
        });
        scannerRef.current = null;
      }
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-black text-lg">バーコードスキャン</h1>
      </div>

      <div className="max-w-md mx-auto">
        {/* スキャナー本体 */}
        <div
          id="reader"
          className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl"
        >
          {/* ここにhtml5-qrcodeがカメラ映像を流し込みます */}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-2xl flex items-center gap-3 text-red-200">
            <AlertCircle size={20} />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <div className="inline-flex p-4 bg-white/5 rounded-full mb-4">
            <Camera className="text-blue-500" size={32} />
          </div>
          <p className="text-sm font-bold text-gray-400">
            カメラをバーコードに向けてください
          </p>
          <p className="text-[10px] text-gray-500 mt-2">
            ※起動しない場合はブラウザの「カメラ許可」を
            <br />
            確認してリロードしてください
          </p>
        </div>
      </div>

      {/* html5-qrcode のデフォルトUIを少し綺麗にするためのスタイル（強引ですが有効です） */}
      <style jsx global>{`
        #reader {
          border: none !important;
        }
        #reader img {
          display: none !important;
        }
        #reader__dashboard_section_csr button {
          background-color: #2563eb !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 12px !important;
          font-weight: bold !important;
          margin-top: 10px !important;
        }
        #reader__status_span {
          color: #9ca3af !important;
          font-size: 12px !important;
        }
      `}</style>
    </main>
  );
}
