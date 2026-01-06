"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Store,
  Trash2,
  MapPin,
  AlertCircle,
  Check,
  X,
  Edit2,
} from "lucide-react";
import Link from "next/link";

export default function ShopMasterPage() {
  const router = useRouter();
  const [shops, setShops] = useState<
    { id: string; name: string; location?: string }[]
  >([]);

  // 編集中のステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("shop-master");
    if (data) setShops(JSON.parse(data));
  }, []);

  // 編集開始
  const startEditing = (shop: any) => {
    setEditingId(shop.id);
    setEditName(shop.name);
    setEditLocation(shop.location || "");
  };

  // 編集保存
  const saveEdit = (id: string) => {
    const updatedShops = shops.map((shop) =>
      shop.id === id
        ? { ...shop, name: editName, location: editLocation }
        : shop
    );
    setShops(updatedShops);
    localStorage.setItem("shop-master", JSON.stringify(updatedShops));
    setEditingId(null);
  };

  const deleteShop = (id: string) => {
    if (
      !confirm(
        "この店舗を削除しますか？\n※商品データの店舗情報は未設定になります。"
      )
    )
      return;
    const newShops = shops.filter((s) => s.id !== id);
    setShops(newShops);
    localStorage.setItem("shop-master", JSON.stringify(newShops));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-10 text-black font-sans">
      <button
        onClick={() => router.back()}
        className="mb-4 text-gray-400 font-bold flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={18} /> 戻る
      </button>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-black">店舗マスタ</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Shop Management
          </p>
        </div>
        <Link
          href="/shop-master/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-1 shadow-lg shadow-blue-100"
        >
          <Plus size={16} /> 店舗追加
        </Link>
      </div>

      <div className="space-y-3">
        {shops.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 border-2 border-dashed border-gray-100 flex flex-col items-center gap-3">
            <AlertCircle size={40} className="text-gray-200" />
            <p className="text-center text-gray-400 font-bold text-sm">
              店舗が登録されていません
            </p>
          </div>
        ) : (
          shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex flex-col gap-2 transition-all"
            >
              {editingId === shop.id ? (
                /* 編集モードのUI */
                <div className="space-y-3 animate-in zoom-in-95 duration-200">
                  <input
                    className="w-full p-2 bg-gray-50 rounded-xl text-sm font-black border-2 border-blue-200 outline-none"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="店舗名"
                    autoFocus
                  />
                  <input
                    className="w-full p-2 bg-gray-50 rounded-xl text-xs font-bold border-2 border-transparent outline-none focus:border-gray-200"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="場所・メモ"
                  />
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl"
                    >
                      <X size={14} /> キャンセル
                    </button>
                    <button
                      onClick={() => saveEdit(shop.id)}
                      className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl"
                    >
                      <Check size={14} /> 保存
                    </button>
                  </div>
                </div>
              ) : (
                /* 通常モードのUI */
                <div className="flex justify-between items-center">
                  <div
                    className="flex items-center gap-4 flex-1"
                    onClick={() => startEditing(shop)}
                  >
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                      <Store size={20} />
                    </div>
                    <div>
                      <div className="font-black text-gray-800 text-base flex items-center gap-2">
                        {shop.name}
                        <Edit2 size={12} className="text-gray-300" />
                      </div>
                      {shop.location && (
                        <div className="text-[11px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                          <MapPin size={12} /> {shop.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteShop(shop.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
