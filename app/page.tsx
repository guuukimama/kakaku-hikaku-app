"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Camera,
  ShoppingBag,
  PackageSearch,
  Plus,
  RefreshCcw,
  Loader2,
} from "lucide-react";

// --- (補助関数 toKatakana, synonymMap はそのまま維持) ---
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("shopping_list").select(`
          *,
          shops ( name )
        `);

      if (data) {
        const formattedData = data.map((item: any) => ({
          ...item,
          shopName: item.shops?.name || "不明な店舗",
        }));
        setItems(formattedData);
      }
      setLoading(false);
    };

    fetchItems();
    const q = searchParams.get("search");
    if (q) setSearchTerm(q);
  }, [searchParams]);

  // ★ここを修正：localStorageではなくSupabaseへ保存
  const addToCart = async (product: any) => {
    try {
      const { error } = await supabase.from("cart_items").insert([
        {
          name: product.name,
          price: product.price,
          shop_id: product.shop_id, // shop_id（アンダーバー）で保存
          stock: product.stock || 0,
          checked: false,
        },
      ]);

      if (error) throw error;

      alert(`${product.name} を買い物リストに追加しました！`);
    } catch (error: any) {
      console.error("カート追加エラー:", error);
      alert(
        "リストへの追加に失敗しました。SQLが実行されているか確認してください。"
      );
    }
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

  // --- (grouped の計算ロジックもそのまま維持) ---
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
      <header className="bg-white px-4 pt-4 pb-2 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4 relative">
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-sm font-bold text-gray-500">価格比較</h2>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="商品名を入力（例：牛乳、醤油）"
            className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="font-bold">データを読み込み中...</p>
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          Object.keys(grouped).map((productName) => (
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
                            {p.shopName}
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
        ) : /* --- (検索結果なし/初期表示の表示部分は維持) --- */
        searchTerm !== "" ? (
          <div className="text-center py-20 text-gray-400">
            <p className="font-bold">「{searchTerm}」は見つかりませんでした</p>
            <Link
              href="/add-product"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black"
            >
              新規登録する
            </Link>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-300">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-sm">
              検索バーから商品を検索してください
            </p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-3 pb-8 z-30">
        <Link
          href="/inventory"
          className="text-gray-400 flex flex-col items-center flex-1"
        >
          <PackageSearch size={26} />
          <span className="text-[10px] font-bold mt-1">在庫</span>
        </Link>
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
      </nav>
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
