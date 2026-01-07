"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Search,
  Store,
  Package,
  ChevronRight,
  Loader2,
  Plus,
  Minus,
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
    const [shopsRes, productsRes] = await Promise.all([
      supabase.from("shops").select("*").order("name"),
      supabase
        .from("shopping_list")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (shopsRes.data) setShops(shopsRes.data);
    if (productsRes.data) setShoppingList(productsRes.data);
  };

  useEffect(() => {
    setLoading(true);
    loadAllData().finally(() => setLoading(false));

    // ★ リアルタイム同期設定
    const channel = supabase
      .channel("master-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list" },
        () => {
          loadAllData(); // 変更があったら再読み込み
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ★ 在庫をその場で更新する関数
  const handleUpdateStock = async (
    id: string,
    currentStock: number,
    diff: number
  ) => {
    const newStock = Math.max(0, currentStock + diff);
    const { error } = await supabase
      .from("shopping_list")
      .update({ stock: newStock })
      .eq("id", id);

    if (error) {
      alert("在庫の更新に失敗しました");
    } else {
      // ローカル状態を即時更新して体感速度を上げる
      setShoppingList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, stock: newStock } : item
        )
      );
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("このデータを削除しますか？")) return;
    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", id);
    if (!error) setShoppingList(shoppingList.filter((i: any) => i.id !== id));
  };

  // データの加工ロジック
  const itemsByShop = shops
    .map((shop) => ({
      ...shop,
      items: shoppingList.filter((item) => item.shop_id === shop.id),
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
        stock: item.stock, // 代表在庫
        id: item.id, // 代表ID
        stores: [],
      });
    }
    const shopInfo = shops.find((s) => s.id === item.shop_id);
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
            マスタ・在庫管理
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
                </div>
                <div className="grid gap-2">
                  {shop.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-[10px] font-black text-blue-500 uppercase">
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
                      {/* 在庫操作バー */}
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 px-4">
                        <span className="text-xs font-bold text-gray-400">
                          在庫:{" "}
                          <span className="text-blue-600 text-sm">
                            {item.stock ?? 0}
                          </span>
                        </span>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() =>
                              handleUpdateStock(item.id, item.stock ?? 0, -1)
                            }
                            className="p-1 text-gray-500 active:scale-90"
                          >
                            <Minus size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStock(item.id, item.stock ?? 0, 1)
                            }
                            className="p-1 text-blue-600 active:scale-90"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
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
                <div className="px-2 flex justify-between items-end">
                  <div>
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
                </div>
                <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
                  {group.stores.map((item: any, sIdx: number) => (
                    <div
                      key={item.id}
                      className={`p-4 flex flex-col gap-3 ${
                        sIdx !== 0 ? "border-t border-gray-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
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
                      {/* 在庫操作バー（商品ごとモード） */}
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 px-4">
                        <span className="text-xs font-bold text-gray-400">
                          在庫:{" "}
                          <span className="text-blue-600 text-sm">
                            {item.stock ?? 0}
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleUpdateStock(item.id, item.stock ?? 0, -1)
                            }
                            className="p-1 text-gray-400"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStock(item.id, item.stock ?? 0, 1)
                            }
                            className="p-1 text-blue-600"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
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
