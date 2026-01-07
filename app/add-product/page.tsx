"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Scale,
  Factory,
  Package,
  Ruler,
  Calculator,
  Store,
  Plus,
  Loader2,
  Hash,
  Camera, // 追加
  Barcode, // 追加
} from "lucide-react";

function AddProductForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("editId");

  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [shopId, setShopId] = useState("");
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [stock, setStock] = useState(1);
  const [jan, setJan] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("g");
  const [customUnit, setCustomUnit] = useState("");
  const [size, setSize] = useState("");
  const [quantityInPack, setQuantityInPack] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitOptions = ["g", "ml", "個", "パック", "本", "枚"];
  const taxIncludedPrice = price ? Math.floor(Number(price) * 1.1) : 0;

  useEffect(() => {
    const fetchShops = async () => {
      const { data } = await supabase
        .from("shops")
        .select("id, name")
        .order("name");
      if (data) setShops(data);
    };
    fetchShops();

    // ★ URLパラメータにjanがあればセット
    const janParam = searchParams.get("jan");
    if (janParam) setJan(janParam);

    if (editId) {
      const fetchProduct = async () => {
        const { data } = await supabase
          .from("shopping_list")
          .select("*")
          .eq("id", editId)
          .single();

        if (data) {
          setBrand(data.brand || "");
          setName(data.name);
          setPrice(data.price.toString());
          setShopId(data.shop_id || "");
          setStock(data.stock || 0);
          setJan(data.jan || "");
          setAmount(data.amount || "");
          if (unitOptions.includes(data.unit)) {
            setUnit(data.unit);
          } else {
            setUnit("その他");
            setCustomUnit(data.unit);
          }
          setSize(data.size || "");
          setQuantityInPack(data.quantity_in_pack?.toString() || "1");
        }
      };
      fetchProduct();
    }
  }, [searchParams, editId]);

  const handleSave = async () => {
    if (!name || !price) return alert("商品名と価格は必須です");
    if (!shopId) return alert("店舗を選択してください");

    setIsSubmitting(true);
    const finalUnit = unit === "その他" ? customUnit : unit;

    const productData: any = {
      brand,
      name,
      price: Number(price),
      shop_id: shopId,
      stock: Number(stock),
      jan, // ★ JANコードを保存対象に含める
      amount,
      unit: finalUnit,
      size,
      quantity_in_pack: unit === "パック" ? Number(quantityInPack) : 1,
    };

    if (!editId) {
      productData.is_visible = false;
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from("shopping_list")
          .update(productData)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shopping_list")
          .insert([productData]);
        if (error) throw error;
      }

      router.push("/master");
      router.refresh();
    } catch (error: any) {
      alert("保存エラー: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-10 text-black font-sans">
      <button
        onClick={() => router.back()}
        className="mb-4 text-gray-400 font-bold flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={18} /> 戻る
      </button>

      <h1 className="text-xl font-black mb-6">
        {editId ? "情報を編集" : "新しく登録する"}
      </h1>

      <div className="space-y-6 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        {/* ★ JANコード入力セクションを追加 */}
        <div>
          <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
            <Barcode size={12} /> JANコード（バーコード）
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="例: 4901234567890"
              className="flex-1 p-3 bg-gray-50 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-blue-100"
              value={jan}
              onChange={(e) => setJan(e.target.value)}
            />
            <button
              type="button"
              onClick={() => router.push("/scan?mode=add")}
              className="bg-blue-600 text-white p-3 rounded-2xl shadow-md shadow-blue-100 active:scale-95 transition-transform"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
              <Factory size={12} /> ブランド・メーカー名
            </label>
            <input
              type="text"
              placeholder="例: 雪印メグミルク"
              className="w-full p-3 bg-gray-50 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-blue-100"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest">
              商品名 *
            </label>
            <input
              type="text"
              placeholder="例: 雪印コーヒー"
              className="w-full p-3 bg-gray-50 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-blue-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black text-gray-400 block uppercase tracking-widest flex items-center gap-1">
              <Store size={12} /> 購入店舗 *
            </label>
            <button
              onClick={() => router.push("/shop-master/add")}
              className="text-[10px] font-black text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full"
            >
              <Plus size={10} /> 新規店舗を追加
            </button>
          </div>
          <div className="relative">
            <select
              className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold appearance-none outline-none border-2 border-transparent focus:border-blue-100"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
            >
              <option value="">店舗を選択（マスタから）</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">
            単位
          </label>
          <div className="grid grid-cols-4 gap-2">
            {unitOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setUnit(opt);
                  setCustomUnit("");
                }}
                className={`py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                  unit === opt
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                    : "bg-gray-50 border-transparent text-gray-400"
                }`}
              >
                {opt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUnit("その他")}
              className={`py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                unit === "その他"
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                  : "bg-gray-50 border-transparent text-gray-400"
              }`}
            >
              その他
            </button>
          </div>
          {unit === "その他" && (
            <input
              type="text"
              placeholder="単位を入力"
              className="w-full mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-600 outline-none"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
              <Scale size={12} /> 内容量
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="1000"
                className="w-full p-3 bg-gray-50 rounded-2xl text-sm font-bold pr-12 border-2 border-transparent"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="absolute right-4 top-3 text-xs font-black text-gray-300">
                {unit === "その他" ? customUnit || "単位" : unit}
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-blue-600 mb-1 block uppercase tracking-widest flex items-center gap-1">
              <Ruler size={12} /> サイズ
            </label>
            <select
              className="w-full p-3 bg-blue-50 text-blue-600 rounded-2xl text-sm font-bold appearance-none outline-none border-2 border-transparent focus:border-blue-200"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="">なし</option>
              <option value="SS">SS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="LL">LL</option>
              <option value="大">大</option>
              <option value="中">中</option>
              <option value="小">小</option>
            </select>
          </div>
        </div>

        {unit === "パック" && (
          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-black text-blue-600 mb-2 block uppercase tracking-widest flex items-center gap-1">
              <Hash size={12} /> 1パックあたりの数量
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="例: 10"
                className="w-full p-3 bg-white rounded-2xl text-sm font-bold text-blue-600 outline-none border-2 border-transparent focus:border-blue-200"
                value={quantityInPack}
                onChange={(e) => setQuantityInPack(e.target.value)}
              />
              <span className="text-sm font-black text-blue-400 shrink-0">
                個/枚 入
              </span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-red-500 mb-1 block uppercase tracking-widest">
                税抜き価格 *
              </label>
              <input
                type="number"
                className="w-full p-3 bg-red-50 text-red-600 font-black rounded-2xl text-lg outline-none border-2 border-transparent focus:border-red-100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <div className="mt-1 px-1 flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Calculator size={10} />
                <span>税込目安: ¥{taxIncludedPrice.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest">
                在庫数
              </label>
              <div className="flex items-center bg-gray-50 rounded-2xl h-[52px] overflow-hidden border-2 border-transparent">
                <button
                  type="button"
                  onClick={() => setStock(Math.max(0, stock - 1))}
                  className="flex-1 font-bold text-xl active:bg-gray-200"
                >
                  -
                </button>
                <span className="flex-1 text-center font-black">{stock}</span>
                <button
                  type="button"
                  onClick={() => setStock(stock + 1)}
                  className="flex-1 font-bold text-xl active:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className={`w-full bg-blue-600 text-white py-4 rounded-[24px] font-black text-lg shadow-lg shadow-blue-100 active:scale-95 transition-all mt-4 flex justify-center items-center gap-2 ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              保存中...
            </>
          ) : (
            "マスタに登録する"
          )}
        </button>
      </div>
    </main>
  );
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddProductForm />
    </Suspense>
  );
}
