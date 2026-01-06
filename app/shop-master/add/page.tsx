"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Supabaseをインポート
import { ArrowLeft, Store, MapPin, Loader2 } from "lucide-react";

export default function AddShopPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 保存中状態

  const handleSave = async () => {
    if (!name) return alert("店舗名を入力してください");

    setIsSubmitting(true);

    try {
      // 【重要】localStorageをやめてSupabaseに挿入
      const { error } = await supabase.from("shops").insert([
        {
          name: name,
          location: location,
        },
      ]);

      if (error) {
        throw error;
      }

      // 成功したら一覧に戻る
      router.push("/shop-master");
      router.refresh();
    } catch (error: any) {
      alert("DB保存エラー: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
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
          disabled={isSubmitting}
          className={`w-full bg-blue-600 text-white py-4 rounded-[24px] font-black text-lg shadow-lg shadow-blue-100 active:scale-95 transition-all mt-4 flex justify-center items-center gap-2 ${
            isSubmitting ? "opacity-70" : ""
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              保存中...
            </>
          ) : (
            "店舗マスタに保存"
          )}
        </button>
      </div>
    </main>
  );
}
