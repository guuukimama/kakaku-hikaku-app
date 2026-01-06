"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        // 読み取ったコードを持って登録画面へ
        router.push(`/add-product?jan=${decodedText}`);
      },
      (error) => {
        // スキャン中はエラーを無視
      }
    );

    return () => {
      scanner
        .clear()
        .catch((error) => console.error("Failed to clear scanner", error));
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col">
      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-gray-300"
      >
        <ArrowLeft size={24} /> 戻る
      </button>

      <div className="text-center mb-8">
        <h1 className="text-xl font-bold">バーコードをスキャン</h1>
        <p className="text-sm text-gray-400">
          枠内にJANコードを合わせてください
        </p>
      </div>

      {/* カメラ映像が表示される場所 */}
      <div id="reader" className="overflow-hidden rounded-lg bg-white"></div>

      {/* 手動登録ボタン */}
      <div className="mt-12 space-y-4">
        <p className="text-center text-gray-500 text-sm">
          バーコードが読み取れない、
          <br />
          または付いていない場合はこちら
        </p>
        <button
          onClick={() => router.push("/add-product")}
          className="w-full py-4 border border-white rounded-xl font-bold hover:bg-white hover:text-black transition-all"
        >
          手動で商品を登録する
        </button>
      </div>

      <div className="mt-auto pb-4 text-center text-gray-600 text-xs">
        ※暗い場所では読み取りにくい場合があります
      </div>
    </main>
  );
}
