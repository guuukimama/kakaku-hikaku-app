"use client";
import Link from "next/link";
import { usePathname } from "next/navigation"; // 1. パスを取得するフックをインポート
import { PackageSearch, Camera, ShoppingBag } from "lucide-react";

export default function FooterPage() {
  const pathname = usePathname(); // 2. 現在のパス（例: "/shopping-list"）を取得

  // 判定用の関数を作るとスッキリします
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-around p-3 pb-8 z-30">
      {/* 在庫 */}
      <Link
        href="/inventory"
        className={`${
          isActive("/inventory") ? "text-blue-600" : "text-gray-400"
        } flex flex-col items-center flex-1`}
      >
        <PackageSearch size={26} />
        <span className="text-[10px] font-black mt-1">在庫</span>
      </Link>

      {/* スキャン */}
      <Link href="/scan" className="flex flex-col items-center flex-1 -mt-10">
        <div className="bg-blue-600 text-white p-4 rounded-full shadow-xl ring-4 ring-white active:scale-95 transition-all">
          <Camera size={28} />
        </div>
        <span
          className={`text-[10px] font-black mt-1 ${
            isActive("/scan") ? "text-blue-600" : "text-gray-400"
          }`}
        >
          スキャン
        </span>
      </Link>

      {/* リスト（ご質問の箇所） */}
      <Link
        href="/shopping-list"
        className={`${
          isActive("/shopping-list") ? "text-blue-600" : "text-gray-400"
        } flex flex-col items-center flex-1`}
      >
        <ShoppingBag size={26} />
        <span className="text-[10px] font-black mt-1">リスト</span>
      </Link>
    </nav>
  );
}
