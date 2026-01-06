"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Camera,
  ShoppingBag,
  PackageSearch,
  Plus,
  RefreshCcw,
} from "lucide-react";

const toKatakana = (str: string) =>
  str.replace(/[ぁ-ん]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0x60));

const synonymMap: { [key: string]: string } = {
  しょうゆ: "醤油",
  醤油: "しょうゆ",
  たまご: "卵",
  卵: "たまご",
  ぎゅうにゅう: "牛乳",
  牛乳: "ぎゅうにゅう",
};

function HomeContent() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const data = localStorage.getItem("shopping-list");
    if (data) setItems(JSON.parse(data));
    const q = searchParams.get("search");
    if (q) setSearchTerm(q);
  }, [searchParams]);

  const addToCart = (product: any) => {
    const data = localStorage.getItem("cart-list");
    const cart = data ? JSON.parse(data) : [];
    cart.push({ ...product, cartId: Date.now() });
    localStorage.setItem("cart-list", JSON.stringify(cart));
    alert("リストに追加しました");
  };

  const filtered =
    searchTerm.trim() === ""
      ? []
      : items.filter((i) => {
          const name = i.name.toLowerCase();
          const brand = (i.brand || "").toLowerCase();
          const targetText = name + brand;
          const query = searchTerm.toLowerCase();
          if (
            targetText.includes(query) ||
            toKatakana(targetText).includes(toKatakana(query))
          )
            return true;
          for (const [key, value] of Object.entries(synonymMap)) {
            if (query.includes(key) && targetText.includes(value)) return true;
            if (query.includes(value) && targetText.includes(key)) return true;
          }
          return false;
        });

  const grouped: { [key: string]: any[] } = {};
  filtered.forEach((item) => {
    const amount = parseFloat(item.amount) || 1;
    let unitPrice = 0;
    let unitLabel = "";
    if (item.unit === "g" || item.unit === "ml") {
      unitPrice = (item.price / amount) * 100;
      unitLabel = `100${item.unit}`;
    } else {
      unitPrice = item.price / amount;
      unitLabel = `1${item.unit}`;
    }
    const itemWithUnitPrice = {
      ...item,
      unitPrice: Math.round(unitPrice * 10) / 10,
      unitLabel,
    };
    if (!grouped[item.name]) grouped[item.name] = [];
    grouped[item.name].push(itemWithUnitPrice);
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-24 text-black font-sans">
      {/* --- ヘッダー領域 --- */}
      <header className="bg-white px-4 pt-4 pb-2 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4 relative">
          {/* 左上ロゴ：クリックでトップ（検索リセット） */}
          <Link
            href="/"
            onClick={() => setSearchTerm("")}
            className="flex items-center gap-1 z-10"
          >
            <div className="bg-blue-600 p-1 rounded-lg">
              <RefreshCcw size={18} className="text-white" />
            </div>
            <span className="text-lg font-black text-blue-600 tracking-tighter">
              底値ナビ
            </span>
          </Link>

          {/* 中央タイトル */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-sm font-bold text-gray-500">価格比較</h2>
          </div>

          {/* 右側の余白（バランス用） */}
          <div className="w-20"></div>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <input
            type="text"
            placeholder="商品名を入力..."
            className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {Object.keys(grouped).length > 0
          ? Object.keys(grouped).map((productName) => (
              <div
                key={productName}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-4 bg-gray-50 flex justify-between items-center">
                  <span className="font-black text-sm">{productName}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Best Price
                  </span>
                </div>

                <div className="p-2 space-y-2">
                  {grouped[productName]
                    .sort((a, b) => a.unitPrice - b.unitPrice)
                    .map((p, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          idx === 0
                            ? "border-blue-100 bg-blue-50/30"
                            : "border-transparent"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-500">
                              {p.shop}
                            </span>
                            {idx === 0 && (
                              <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black">
                                最安
                              </span>
                            )}
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="leading-none">
                              <span className="text-xl font-black text-blue-600">
                                ¥{p.price}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-1">
                                ({p.amount}
                                {p.unit})
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-blue-700 bg-white border border-blue-100 px-2 py-0.5 rounded-lg shadow-sm">
                              {p.unitLabel} ¥{p.unitPrice}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          className="bg-blue-600 text-white p-2.5 rounded-xl active:scale-90 shadow-md"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))
          : searchTerm !== "" && (
              <div className="text-center py-20 text-gray-400">
                <p className="font-bold font-sans">
                  「{searchTerm}」は見つかりませんでした
                </p>
                <Link
                  href="/add-product"
                  className="inline-block mt-4 bg-gray-200 text-gray-700 px-6 py-2 rounded-full text-xs font-black"
                >
                  新規登録する
                </Link>
              </div>
            )}
      </div>

      {/* --- 新しいナビゲーション（比較を削除） --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-3 pb-8 z-30">
        <Link
          href="/inventory"
          className="text-gray-400 flex flex-col items-center flex-1"
        >
          <PackageSearch size={26} />
          <span className="text-[10px] font-bold mt-1">在庫</span>
        </Link>

        {/* スキャンボタン（中心） */}
        <Link href="/scan" className="flex flex-col items-center flex-1 -mt-10">
          <div className="bg-blue-600 text-white p-4 rounded-full shadow-xl ring-4 ring-white active:scale-90 transition-transform">
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
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
