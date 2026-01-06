"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // インポート追加
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Search,
  Store,
  Package,
  ChevronRight,
  Loader2, // 読み込み中アイコン
} from "lucide-react";

export default function MasterPage() {
  const [viewMode, setViewMode] = useState<"shop" | "product">("shop");
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // DBから全データを読み込む
  const loadAllData = async () => {
    setLoading(true);

    // 店舗データと商品データを並列で取得
    const [shopsRes, productsRes] = await Promise.all([
      supabase.from("shops").select("*").order("name"),
      supabase
        .from("shopping_list")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (shopsRes.data) setShops(shopsRes.data);
    if (productsRes.data) setShoppingList(productsRes.data);

    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 削除機能もDB連動に
  const deleteItem = async (id: string) => {
    if (!confirm("このデータを削除しますか？")) return;

    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除に失敗しました");
    } else {
      setShoppingList(shoppingList.filter((i: any) => i.id !== id));
    }
  };

  // --- データの加工 (ロジックは維持) ---
  const itemsByShop = shops
    .map((shop) => ({
      ...shop,
      items: shoppingList.filter((item) => item.shop_id === shop.id), // shop_id に修正
    }))
    .filter((shop) => shop.items.length > 0 || searchTerm === "");

  const productGroups = new Map();
  shoppingList.forEach((item) => {
    const key = `${item.name}-${item.brand || ""}`;
    if (!productGroups.has(key)) {
      productGroups.set(key, {
        name: item.name,
        brand: item.brand,
        unit: item.unit,
        amount: item.amount,
        stores: [],
      });
    }
    const shopInfo = shops.find((s) => s.id === item.shop_id); // shop_id に修正
    productGroups
      .get(key)
      .stores.push({ ...item, shopName: shopInfo?.name || "不明" });
  });

  const itemsByProduct = Array.from(productGroups.values()).map((g) => ({
    ...g,
    stores: g.stores.sort((a: any, b: any) => a.price - b.price),
  }));

  const filteredShops = itemsByShop.filter((s) => s.name.includes(searchTerm));
  const filteredProducts = itemsByProduct.filter(
    (p) => p.name.includes(searchTerm) || p.brand?.includes(searchTerm)
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-20 text-black font-sans">
      <header className="bg-white px-4 pt-4 pb-2 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="text-gray-400 p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-black flex-1 text-center pr-10">
            マスタ・価格管理
          </h1>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
          <button
            onClick={() => setViewMode("shop")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
              viewMode === "shop"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-400"
            }`}
          >
            <Store size={16} /> 店舗ごと
          </button>
          <button
            onClick={() => setViewMode("product")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
              viewMode === "product"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-400"
            }`}
          >
            <Package size={16} /> 商品ごと
          </button>
        </div>

        <div className="relative mb-2">
          <input
            type="text"
            placeholder={
              viewMode === "shop"
                ? "店舗名で検索..."
                : "商品名・ブランドで検索..."
            }
            className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-10 outline-none text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto text-gray-300" size={32} />
          </div>
        ) : viewMode === "shop" ? (
          <div className="space-y-6">
            {filteredShops.map((shop) => (
              <div key={shop.id} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                    <Store size={16} />
                  </div>
                  <h3 className="font-black text-gray-800">{shop.name}</h3>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {shop.items.length}件の商品
                  </span>
                </div>
                <div className="grid gap-2">
                  {shop.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-[10px] font-black text-blue-500">
                          {item.brand}
                        </div>
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-lg font-black mt-1">
                          ¥{Number(item.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            router.push(`/add-product?editId=${item.id}`)
                          }
                          className="p-2 text-gray-400"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-gray-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProducts.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <div className="px-2">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    {group.brand || "ノーブランド"}
                  </div>
                  <h3 className="font-black text-gray-800 text-lg">
                    {group.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {group.amount}
                    {group.unit}
                  </p>
                </div>
                <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
                  {group.stores.map((item: any, sIdx: number) => (
                    <div
                      key={item.id}
                      className={`p-4 flex justify-between items-center ${
                        sIdx !== 0 ? "border-t border-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            sIdx === 0
                              ? "bg-amber-400 animate-pulse"
                              : "bg-gray-200"
                          }`}
                        />
                        <div>
                          <div className="text-[10px] font-black text-gray-400">
                            {item.shopName}
                          </div>
                          <div className="font-black text-base">
                            ¥{Number(item.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/add-product?editId=${item.id}`)
                        }
                        className="p-2 text-gray-400"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
