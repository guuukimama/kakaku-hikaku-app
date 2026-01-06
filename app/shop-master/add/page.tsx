"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store, MapPin } from "lucide-react";

export default function AddShopPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const handleSave = () => {
    if (!name) return alert("店舗名を入力してください");

    const data = localStorage.getItem("shop-master");
    const shops = data ? JSON.parse(data) : [];

    const newShop = {
      id: Date.now().toString(),
      name,
      location,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("shop-master", JSON.stringify([...shops, newShop]));
    router.back(); // 前の画面に戻る（商品登録中なら商品登録へ）
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-black">
      <button
        onClick={() => router.back()}
        className="mb-4 text-gray-400 font-bold flex items-center gap-1 text-sm text-left"
      >
        <ArrowLeft size={18} /> 戻る
      </button>

      <h1 className="text-xl font-black mb-6">店舗を登録</h1>

      <div className="space-y-6 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        <div>
          <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
            <Store size={12} /> 店舗名 *
          </label>
          <input
            type="text"
            placeholder="例: ライフ 渋谷店"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-blue-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
            <MapPin size={12} /> 場所・メモ
          </label>
          <input
            type="text"
            placeholder="例: 駅ビル1F"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-blue-100"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-4 rounded-[24px] font-black text-lg shadow-lg shadow-blue-100 active:scale-95 transition-all mt-4"
        >
          店舗マスタに保存
        </button>
      </div>
    </main>
  );
}
