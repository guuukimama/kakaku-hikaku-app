"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCcw,
  PackageSearch,
  Camera,
  ShoppingBag,
  Plus,
  Minus,
  LayoutList,
  Store, // 店舗アイコンを追加
} from "lucide-react";

export default function InventoryPage() {
  const [masterItems, setMasterItems] = useState<any[]>([]);

  const loadData = () => {
    const data = localStorage.getItem("shopping-list");
    if (data) {
      const allData = JSON.parse(data);
      const uniqueMap = new Map();
      allData.forEach((item: any) => {
        const key = `${item.name}-${item.brand || "no-brand"}-${
          item.amount || ""
        }`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { ...item });
        }
      });
      setMasterItems(Array.from(uniqueMap.values()));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStock = (targetItem: any, delta: number) => {
    const data = localStorage.getItem("shopping-list");
    if (!data) return;
    const allData = JSON.parse(data);
    const currentStock = targetItem.stock || 0;
    const newStock = Math.max(0, currentStock + delta);

    const newList = allData.map((item: any) => {
      if (item.name === targetItem.name && item.brand === targetItem.brand) {
        return { ...item, stock: newStock };
      }
      return item;
    });

    localStorage.setItem("shopping-list", JSON.stringify(newList));
    loadData();
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24 text-black font-sans">
      <header className="bg-white px-4 pt-4 pb-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-1 z-10">
            <div className="bg-blue-600 p-1 rounded-lg">
              <RefreshCcw size={18} className="text-white" />
            </div>
            <span className="text-lg font-black text-blue-600 tracking-tighter">
              底値ナビ
            </span>
          </Link>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-sm font-bold text-gray-500">在庫・マスタ</h2>
          </div>

          {/* 右側のボタンエリア */}
          <div className="flex items-center gap-1 z-10">
            {/* 店舗マスタボタンを追加 */}
            <Link
              href="/shop-master"
              className="bg-blue-50 p-2 rounded-xl text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
              title="店舗マスタ"
            >
              <Store size={20} />
            </Link>

            {/* 商品マスタボタン */}
            <Link
              href="/master"
              className="bg-gray-50 p-2 rounded-xl text-gray-600 border border-gray-100 hover:bg-gray-100 transition-colors"
              title="商品マスタ"
            >
              <LayoutList size={20} />
            </Link>

            {/* 新規登録ボタン */}
            <Link
              href="/add-product"
              className="bg-gray-900 p-2 rounded-xl text-white hover:bg-black transition-colors"
              title="新規登録"
            >
              <Plus size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* --- 以降、商品リスト部分は同じ --- */}
      <div className="p-4 space-y-3">
        {masterItems.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <PackageSearch size={48} className="text-gray-200" />
            <div className="text-gray-400 font-bold">
              <p>登録された商品がありません</p>
              <p className="text-xs font-normal mt-1">
                「＋」から商品を追加してください
              </p>
            </div>
          </div>
        ) : (
          masterItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {item.brand && (
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black">
                      {item.brand}
                    </span>
                  )}
                  <span className="text-[9px] text-gray-300 font-bold">
                    #登録済
                  </span>
                </div>
                <h3 className="font-black text-sm text-gray-800">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-400">
                  {item.amount}
                  {item.unit}
                </p>
              </div>

              <div className="flex items-center bg-gray-50 rounded-2xl p-1 gap-4 border border-gray-100">
                <button
                  onClick={() => updateStock(item, -1)}
                  className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm active:scale-95 transition-transform"
                >
                  <Minus size={18} className="text-gray-400" />
                </button>
                <div className="flex flex-col items-center min-w-[20px]">
                  <span className="font-black text-lg">{item.stock || 0}</span>
                </div>
                <button
                  onClick={() => updateStock(item, 1)}
                  className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- ナビゲーションバー --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-3 pb-8 z-30">
        <Link
          href="/inventory"
          className="text-blue-600 flex flex-col items-center flex-1"
        >
          <PackageSearch size={26} />
          <span className="text-[10px] font-bold mt-1">在庫</span>
        </Link>
        <Link href="/scan" className="flex flex-col items-center flex-1 -mt-10">
          <div className="bg-blue-600 text-white p-4 rounded-full shadow-xl ring-4 ring-white">
            <Camera size={28} />
          </div>
          <span className="text-[10px] font-bold mt-1 text-gray-500">
            スキャン
          </span>
        </Link>
        <Link
          href="/shopping-list"
          className="text-gray-400 flex flex-col items-center flex-1"
        >
          <ShoppingBag size={26} />
          <span className="text-[10px] font-bold mt-1">リスト</span>
        </Link>
      </nav>
    </main>
  );
}
