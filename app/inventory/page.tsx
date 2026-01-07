"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  RefreshCcw,
  PackageSearch,
  Camera,
  ShoppingBag,
  Plus,
  Minus,
  LayoutList,
  Store,
  Loader2,
  MapPin,
  Trash2,
  ShoppingCart,
} from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data, error } = await supabase
      .from("shopping_list")
      .select(`*, shops ( name )`)
      .order("created_at", { ascending: false });

    if (data) {
      const formattedData = data.map((item: any) => ({
        ...item,
        shopName: item.shops?.name || "不明な店舗",
      }));
      setItems(formattedData);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));

    const channel = supabase
      .channel("inventory-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ★ 買い物リストへの追加（重複防止ロジック付き）
  const addToCart = async (item: any) => {
    try {
      // 1. すでにカートに同じ商品（名前と店舗IDが一致）があるか確認
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, checked")
        .eq("name", item.name)
        .eq("shop_id", item.shop_id)
        .maybeSingle();

      if (existingItem) {
        // 2. すでにある場合：チェックを外して「未完了」にするだけで新規追加はしない
        if (existingItem.checked) {
          await supabase
            .from("cart_items")
            .update({ checked: false })
            .eq("id", existingItem.id);
          alert(
            `「${item.name}」は既にリストにありましたが、再度買うものとして更新しました`
          );
        } else {
          alert(`「${item.name}」は既に買い物リストに入っています`);
        }
        return;
      }

      // 3. まだない場合のみ、新規インサート
      const { error } = await supabase.from("cart_items").insert([
        {
          name: item.name,
          price: item.price,
          amount: item.amount,
          unit: item.unit,
          shop_id: item.shop_id,
          checked: false,
          stock: item.stock || 0,
        },
      ]);

      if (!error) {
        alert(`「${item.name}」を買い物リストに追加しました`);
      }
    } catch (e) {
      console.error("カート追加エラー:", e);
    }
  };

  const deleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`「${itemName}」を削除しますか？`)) return;
    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", itemId);
    if (!error) setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateStock = async (item: any, delta: number) => {
    const newStock = Math.max(0, (item.stock || 0) + delta);

    const { error } = await supabase
      .from("shopping_list")
      .update({ stock: newStock })
      .eq("id", item.id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i))
      );

      if (newStock === 0 && delta < 0) {
        if (
          confirm(
            `在庫がなくなりました。「${item.name}」を買い物リストに追加しますか？`
          )
        ) {
          addToCart(item);
        }
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24 text-black font-sans">
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <RefreshCcw size={18} className="text-white" />
          </div>
          <span className="text-lg font-black text-blue-600 tracking-tighter">
            底値ナビ
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/master"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <LayoutList size={22} />
          </Link>
          <Link
            href="/shop-master"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Store size={22} />
          </Link>
          <Link
            href="/add-product"
            className="ml-1 bg-blue-600 text-white p-2 rounded-xl active:scale-90 transition-transform shadow-sm"
          >
            <Plus size={22} />
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold italic">
            商品はまだありません
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden"
            >
              <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-blue-500" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    {item.shopName}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="text-gray-400 hover:text-blue-600 transition-colors active:scale-90"
                >
                  <ShoppingCart size={18} />
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  {item.brand && (
                    <div className="mb-1">
                      <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-400 font-bold">
                        {item.brand}
                      </span>
                    </div>
                  )}
                  <h3 className="font-black text-xl text-gray-800 leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-400 font-bold mt-1">
                    {item.amount}
                    {item.unit} /{" "}
                    <span className="text-blue-600">
                      ¥{(item.price || 0).toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  <button
                    onClick={() => updateStock(item, -1)}
                    className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Minus size={20} className="text-gray-400" />
                  </button>
                  <span className="text-xl font-black min-w-[30px] text-center text-gray-700">
                    {item.stock || 0}
                  </span>
                  <button
                    onClick={() => updateStock(item, 1)}
                    className="w-10 h-10 bg-blue-600 rounded-xl shadow-md flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus size={20} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="px-4 py-2 flex justify-end bg-white border-t border-gray-50/50">
                <button
                  onClick={() => deleteItem(item.id, item.name)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={12} />
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-around p-3 pb-8 z-30">
        <Link
          href="/inventory"
          className="text-blue-600 flex flex-col items-center flex-1"
        >
          <PackageSearch size={26} />
          <span className="text-[10px] font-black mt-1">在庫</span>
        </Link>
        <Link href="/scan" className="flex flex-col items-center flex-1 -mt-10">
          <div className="bg-blue-600 text-white p-4 rounded-full shadow-xl ring-4 ring-white active:scale-95 transition-all">
            <Camera size={28} />
          </div>
          <span className="text-[10px] font-black mt-1 text-gray-400">
            スキャン
          </span>
        </Link>
        <Link
          href="/shopping-list"
          className="text-gray-400 flex flex-col items-center flex-1"
        >
          <ShoppingBag size={26} />
          <span className="text-[10px] font-black mt-1">リスト</span>
        </Link>
      </nav>
    </main>
  );
}
