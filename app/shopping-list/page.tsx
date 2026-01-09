"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Footer from "../Footer/page.tsx";
import {
  RefreshCcw,
  PackageSearch,
  Camera,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Circle,
  MapPin,
  Loader2,
  LayoutList,
  Store,
  ShoppingCart,
} from "lucide-react";

export default function ShoppingListPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: cartData } = await supabase
        .from("cart_items")
        .select(`*`)
        .order("created_at", { ascending: true });

      const { data: masterData } = await supabase
        .from("shopping_list")
        .select(`*, shops(name)`);

      if (cartData && masterData) {
        const updatedCart = cartData.map((item: any) => {
          const master = masterData.find(
            (m) => m.name === item.name && m.shop_id === item.shop_id
          );
          return {
            ...item,
            stock: master?.stock ?? item.stock ?? 0,
            price: master?.price ?? item.price ?? 0,
            amount: master?.amount ?? item.amount ?? "",
            unit: master?.unit ?? item.unit ?? "",
            shopName: master?.shops?.name || "その他",
            master_id: master?.id,
          };
        });
        setCart(updatedCart);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));

    const channel = supabase
      .channel("realtime-shopping-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 1. チェック状態の切り替え（DBのcheckedのみ更新。在庫はまだ触らない）
  const toggleCheck = async (item: any) => {
    const newStatus = !item.checked;
    await supabase
      .from("cart_items")
      .update({ checked: newStatus })
      .eq("id", item.id);

    // ローカル状態を即時更新
    setCart((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: newStatus } : i))
    );
  };

  // 2. ★購入確定処理（チェックされた商品を一括で在庫反映＆リスト削除）
  const handlePurchase = async () => {
    const checkedItems = cart.filter((i) => i.checked);
    if (checkedItems.length === 0) return;

    if (
      !confirm(
        `${checkedItems.length}件の商品を購入確定し、在庫に反映しますか？`
      )
    )
      return;

    try {
      for (const item of checkedItems) {
        // 在庫マスタを更新
        if (item.master_id) {
          const newStock = (item.stock || 0) + 1;
          await supabase
            .from("shopping_list")
            .update({ stock: newStock })
            .eq("id", item.master_id);
        }
      }

      // 買い物リストから削除
      const idsToRemove = checkedItems.map((i) => i.id);
      await supabase.from("cart_items").delete().in("id", idsToRemove);

      alert("購入を確定しました！");
      fetchData();
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    }
  };

  // 3. ゴミ箱ボタン（単純にリストから消す。在庫は増やさない）
  const removeCheckedItems = async () => {
    const checkedItems = cart.filter((i) => i.checked);
    if (checkedItems.length === 0) {
      if (confirm("リストをすべて空にしますか？（在庫は増えません）")) {
        await supabase
          .from("cart_items")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        fetchData();
      }
      return;
    }
    if (
      confirm(
        `${checkedItems.length}件をリストから削除しますか？（在庫は増えません）`
      )
    ) {
      const idsToRemove = checkedItems.map((i) => i.id);
      await supabase.from("cart_items").delete().in("id", idsToRemove);
      fetchData();
    }
  };

  const groupedByShop = cart.reduce((acc: any, item: any) => {
    const shop = item.shopName;
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(item);
    return acc;
  }, {});

  const checkedCount = cart.filter((i) => i.checked).length;

  return (
    <main className="min-h-screen bg-gray-50 pb-32 text-black font-sans">
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
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            <LayoutList size={22} />
          </Link>
          <Link
            href="/shop-master"
            className="p-2 text-gray-400 hover:text-blue-600"
          >
            <Store size={22} />
          </Link>
          <button onClick={removeCheckedItems} className="p-2 active:scale-90">
            <Trash2
              size={22}
              className={checkedCount > 0 ? "text-red-500" : "text-gray-300"}
            />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto text-gray-300" size={32} />
          </div>
        ) : Object.keys(groupedByShop).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold italic mb-4">
              リストは空です
            </p>
          </div>
        ) : (
          Object.entries(groupedByShop).map(
            ([shopName, items]: [string, any]) => (
              <div key={shopName} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <MapPin size={14} className="text-blue-600" />
                  <h3 className="font-black text-xs text-blue-600 uppercase tracking-wider">
                    {shopName}
                  </h3>
                  <div className="flex-1 border-b border-blue-100 border-dashed"></div>
                </div>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item)}
                      className={`bg-white p-4 rounded-3xl shadow-sm border transition-all cursor-pointer flex justify-between items-center ${
                        item.checked
                          ? "border-blue-200 bg-blue-50/30"
                          : "border-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="shrink-0">
                          {item.checked ? (
                            <CheckCircle2 className="text-blue-600" size={30} />
                          ) : (
                            <Circle className="text-gray-200" size={30} />
                          )}
                        </div>
                        <div>
                          <h3
                            className={`font-black text-xl leading-tight ${
                              item.checked ? "text-blue-800" : "text-gray-800"
                            }`}
                          >
                            {item.name}
                          </h3>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-sm font-bold text-gray-400">
                              {item.amount}
                              {item.unit}
                            </span>
                            <span className="text-gray-200 text-xs">/</span>
                            <span className="text-lg font-bold text-blue-600">
                              ¥{(item.price || 0).toLocaleString()}
                            </span>
                            <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                              在庫: {item.stock}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* ★ 購入確定ボタン（チェックが入っている時だけ下からスッと出る） */}
      {checkedCount > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={handlePurchase}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <ShoppingCart size={24} />
            <span className="font-black text-lg">
              {checkedCount}件の購入を確定する
            </span>
          </button>
        </div>
      )}

      <Footer />
    </main>
  );
}
