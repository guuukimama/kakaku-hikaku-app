"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Footer from "../Footer/page";
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
  EyeOff, // 非表示アイコン
  ShoppingCart,
} from "lucide-react";
import FooterPage from "../Footer/page";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. データの読み込み（is_visible が true のものだけ）
  const loadData = async () => {
    const { data, error } = await supabase
      .from("shopping_list")
      .select(`*, shops ( name )`)
      .eq("is_visible", true) // ★ 表示設定がONのものだけ取得
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
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. ★ 非表示にする処理（DBは消さない）
  const hideItem = async (itemId: string, itemName: string) => {
    if (
      !confirm(
        `「${itemName}」を一覧から非表示にしますか？\n（データは削除されません）`
      )
    )
      return;

    const { error } = await supabase
      .from("shopping_list")
      .update({ is_visible: false }) // フラグを更新
      .eq("id", itemId);

    if (!error) {
      // ローカル状態から即座に消す
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  // --- 買い物リスト追加や在庫更新の関数はそのまま維持 ---
  const addToCart = async (item: any) => {
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, checked")
      .eq("name", item.name)
      .eq("shop_id", item.shop_id)
      .maybeSingle();

    if (existingItem) {
      if (existingItem.checked) {
        await supabase
          .from("cart_items")
          .update({ checked: false })
          .eq("id", existingItem.id);
        alert(`「${item.name}」を再度買うものとして更新しました`);
      } else {
        alert(`「${item.name}」は既に買い物リストに入っています`);
      }
      return;
    }

    await supabase.from("cart_items").insert([
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
    alert(`「${item.name}」をリストに追加しました`);
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
            `在庫切れです。「${item.name}」を買い物リストに追加しますか？`
          )
        )
          addToCart(item);
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
          <Link href="/master" className="p-2 text-gray-400">
            <LayoutList size={22} />
          </Link>
          <Link href="/shop-master" className="p-2 text-gray-400">
            <Store size={22} />
          </Link>
          <Link
            href="/add-product"
            className="ml-1 bg-blue-600 text-white p-2 rounded-xl shadow-sm"
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
            表示できる商品はありません
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
                  className="text-gray-400 hover:text-blue-600 active:scale-90 transition-all"
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
                {/* ★ 削除ではなく非表示ボタン */}
                <button
                  onClick={() => hideItem(item.id, item.name)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-300 hover:text-orange-400 transition-colors p-1"
                >
                  <EyeOff size={12} />
                  非表示にする
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Footer />
    </main>
  );
}
