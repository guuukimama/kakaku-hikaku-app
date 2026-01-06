"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // 接続用クライアント
import {
  ArrowLeft,
  Plus,
  Store,
  Trash2,
  MapPin,
  AlertCircle,
  Edit2,
} from "lucide-react";
import Link from "next/link";

export default function ShopMasterPage() {
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // DBから店舗一覧を取得する関数
  const fetchShops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setShops(data);
    } else {
      console.error("データ取得エラー:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // 削除機能
  const deleteShop = async (id: string) => {
    if (!confirm("この店舗を削除しますか？")) return;
    const { error } = await supabase.from("shops").delete().eq("id", id);
    if (!error) fetchShops();
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-black font-sans">
      <button
        onClick={() => router.back()}
        className="mb-4 text-gray-400 font-bold flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={18} /> 戻る
      </button>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-800">店舗マスタ</h1>
          <p className="text-[10px] text-blue-500 font-black tracking-widest uppercase">
            Cloud Database Mode
          </p>
        </div>
        <Link
          href="/shop-master/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-1 shadow-lg"
        >
          <Plus size={16} /> 店舗追加
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400 font-bold animate-pulse">
            読み込み中...
          </div>
        ) : shops.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 border-2 border-dashed border-gray-100 flex flex-col items-center gap-3">
            <AlertCircle size={40} className="text-gray-200" />
            <p className="text-center text-gray-400 font-bold text-sm">
              店舗を登録してください
            </p>
          </div>
        ) : (
          shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                  <Store size={20} />
                </div>
                <div>
                  <div className="font-black text-gray-800 text-base">
                    {shop.name}
                  </div>
                  {shop.location && (
                    <div className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                      <MapPin size={12} /> {shop.location}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteShop(shop.id)}
                className="text-gray-200 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
