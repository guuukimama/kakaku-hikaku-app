"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCcw,
  PackageSearch,
  Camera,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Circle,
  MapPin,
} from "lucide-react";

export default function ShoppingListPage() {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("cart-list");
    if (data) setCart(JSON.parse(data));
  }, []);

  // 個別のチェック切り替え
  const toggleCheck = (cartId: number) => {
    const newList = cart.map((item) => {
      if (item.cartId === cartId) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    setCart(newList);
    localStorage.setItem("cart-list", JSON.stringify(newList));
  };

  // チェックを入れた項目だけを削除（ゴミ箱ボタン）
  const removeCheckedItems = () => {
    const checkedCount = cart.filter((i) => i.checked).length;
    if (checkedCount === 0) {
      if (confirm("リストをすべて空にしますか？")) {
        setCart([]);
        localStorage.removeItem("cart-list");
      }
      return;
    }

    if (confirm(`${checkedCount}件のチェック済み商品を削除しますか？`)) {
      const newList = cart.filter((item) => !item.checked);
      setCart(newList);
      localStorage.setItem("cart-list", JSON.stringify(newList));
    }
  };

  const groupedByShop = cart.reduce((acc: any, item: any) => {
    const shop = item.shop || "その他";
    if (!acc[shop]) acc[shop] = [];
    acc[shop].push(item);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-50 pb-24 text-black">
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
            <h2 className="text-sm font-bold text-gray-500">買い物リスト</h2>
          </div>
          {/* ゴミ箱ボタン：チェックありならそれらを削除、なしなら全削除 */}
          <button
            onClick={removeCheckedItems}
            className="z-10 text-gray-400 p-2 active:scale-90 transition-transform"
          >
            <Trash2
              size={20}
              className={
                cart.some((i) => i.checked) ? "text-red-500" : "text-gray-400"
              }
            />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {Object.keys(groupedByShop).length === 0 ? (
          <div className="text-center py-20 text-gray-300 font-bold italic">
            リストは空です
          </div>
        ) : (
          Object.entries(groupedByShop).map(
            ([shopName, items]: [string, any]) => (
              <div key={shopName} className="space-y-2">
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
                      key={item.cartId}
                      onClick={() => toggleCheck(item.cartId)}
                      className={`bg-white p-4 rounded-3xl shadow-sm border transition-all cursor-pointer flex justify-between items-center ${
                        item.checked
                          ? "border-gray-100 opacity-60"
                          : "border-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          {item.checked ? (
                            <CheckCircle2 className="text-blue-600" size={24} />
                          ) : (
                            <Circle className="text-gray-200" size={24} />
                          )}
                        </div>
                        <div>
                          <h3
                            className={`font-black text-sm transition-all ${
                              item.checked
                                ? "line-through text-gray-400"
                                : "text-gray-800"
                            }`}
                          >
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-[11px] font-bold ${
                                item.checked ? "text-gray-300" : "text-blue-600"
                              }`}
                            >
                              ¥{item.price}
                            </p>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                              在庫: {item.stock || 0}
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-3 pb-8 z-30">
        <Link
          href="/inventory"
          className="text-gray-400 flex flex-col items-center flex-1"
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
          className="text-blue-600 flex flex-col items-center flex-1"
        >
          <ShoppingBag size={26} />
          <span className="text-[10px] font-bold mt-1">リスト</span>
        </Link>
      </nav>
    </main>
  );
}
