"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Footer from "./Footer/page.tsx";
import {
  Search,
  Camera,
  ShoppingBag,
  PackageSearch,
  Plus,
  RefreshCcw,
  Loader2,
} from "lucide-react";

// --- 補助関数 ---
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

  // ★ リスト（カート）への追加処理（重複防止版）
  const addToCart = async (product: any) => {
    try {
      // 1. すでにリストに同じ商品（名前と店舗IDが一致）があるか確認
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, checked")
        .eq("name", product.name)
        .eq("shop_id", product.shop_id)
        .maybeSingle();

      if (existingItem) {
        // 2. すでにある場合：チェックを外して復活させる
        if (existingItem.checked) {
          await supabase
            .from("cart_items")
            .update({ checked: false })
            .eq("id", existingItem.id);
          alert(
            `${product.name} は既にリストにありましたが、未完了に戻しました。`
          );
        } else {
          alert(`${product.name} は既に買い物リストに入っています。`);
        }
        return;
      }

      // 3. まだない場合のみ追加
      const { error } = await supabase.from("cart_items").insert([
        {
          name: product.name,
          price: product.price,
          amount: product.amount,
          unit: product.unit,
          shop_id: product.shop_id,
          stock: product.stock || 0,
          checked: false,
        },
      ]);

      if (error) throw error;
      alert(`${product.name} をリストに追加しました！`);
    } catch (error: any) {
      console.error("追加エラー:", error);
      alert("追加に失敗しました。");
    }
  };

  // --- 修正箇所：検索フィルタリング ---
  const filtered =
    searchTerm.trim() === ""
      ? []
      : items.filter((i) => {
          const name = i.name.toLowerCase();
          const brand = (i.brand || "").toLowerCase();
          const jan = (i.jan || "").toLowerCase(); // ★ JANコードを取得

          const query = searchTerm.toLowerCase();

          // ★ jan.includes(query) を追加することで、JANコード検索に対応
          if (
            name.includes(query) ||
            brand.includes(query) ||
            jan.includes(query) || // ← ここを追加！
            toKatakana(name + brand).includes(toKatakana(query))
          )
            return true;

          for (const [key, value] of Object.entries(synonymMap)) {
            if (query.includes(key) && name.includes(value)) return true;
            if (query.includes(value) && name.includes(key)) return true;
          }
          return false;
        });
  // 商品ごとにグルーピング & 単価計算（変更なし）
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
              <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                <span className="font-black text-sm">{productName}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Price List
                </span>
              </div>

              <div className="p-2 space-y-2">
                {grouped[productName]
                  .sort((a, b) => a.unitPrice - b.unitPrice)
                  .map((p, idx) => {
                    const isCheapest = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isCheapest
                            ? "border-red-200 bg-red-50/50 shadow-sm"
                            : "border-transparent"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-500">
                              {p.shopName}
                            </span>
                            {isCheapest && (
                              <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                最安値
                              </span>
                            )}
                            {/* ★ 在庫数の表示を追加 */}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                p.stock > 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              在庫: {p.stock}
                            </span>
                          </div>

                          <div className="flex items-end gap-2">
                            <div className="leading-none">
                              <span
                                className={`text-xl font-black ${
                                  isCheapest ? "text-red-600" : "text-blue-600"
                                }`}
                              >
                                ¥{p.price}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-1">
                                ({p.amount}
                                {p.unit})
                              </span>
                            </div>
                            <div
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm border ${
                                isCheapest
                                  ? "text-red-700 bg-white border-red-100"
                                  : "text-blue-700 bg-white border-blue-100"
                              }`}
                            >
                              {p.unitLabel} ¥{p.unitPrice}
                            </div>
                          </div>
                        </div>
                        {/* ...（ボタン部分はそのまま） */}
                        <button
                          onClick={() => addToCart(p)}
                          className={`${
                            isCheapest ? "bg-red-600" : "bg-blue-600"
                          } text-white p-2.5 rounded-xl active:scale-90 shadow-md transition-colors`}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        ) : searchTerm !== "" ? (
          <div className="text-center py-20 text-gray-400">
            <p className="font-bold">「{searchTerm}」は見つかりませんでした</p>
            <Link
              href="/add-product"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-lg"
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
      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
