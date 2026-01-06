"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import {
  ArrowLeft,
  Scale,
  Factory,
  Package,
  Ruler,
  Calculator,
  Store,
  Plus,
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

  const unitOptions = ["g", "ml", "個", "パック", "本", "枚"];
  const taxIncludedPrice = price ? Math.floor(Number(price) * 1.1) : 0;

  useEffect(() => {
    // 店舗マスタの読み込み（登録されているものだけを表示）
    const shopData = localStorage.getItem("shop-master");
    if (shopData) {
      setShops(JSON.parse(shopData));
    }

    const janParam = searchParams.get("jan");
    if (janParam) setJan(janParam);

    if (editId) {
      const data = localStorage.getItem("shopping-list");
      if (data) {
        const item = JSON.parse(data).find((i: any) => i.id === editId);
        if (item) {
          setBrand(item.brand || "");
          setName(item.name);
          setPrice(item.price.toString());
          setShopId(item.shopId || "");
          setStock(item.stock || 0);
          setJan(item.jan || "");
          setAmount(item.amount || "");
          if (unitOptions.includes(item.unit)) {
            setUnit(item.unit);
          } else {
            setUnit("その他");
            setCustomUnit(item.unit);
          }
          setSize(item.size || "");
          setQuantityInPack(item.quantityInPack?.toString() || "1");
        }
      }
    }
  }, [searchParams, editId]);

  const handleSave = () => {
    if (!name || !price) return alert("商品名と価格は必須です");
    if (!shopId) return alert("店舗を選択してください（マスタ登録が必要です）");

    const data = localStorage.getItem("shopping-list");
    let list = data ? JSON.parse(data) : [];
    const finalUnit = unit === "その他" ? customUnit : unit;

    const productData = {
      brand,
      name,
      price: Number(price),
      shopId,
      stock,
      jan,
      amount,
      unit: finalUnit,
      size,
      quantityInPack: unit === "パック" ? Number(quantityInPack) : 1,
      updatedAt: new Date().toISOString(),
    };

    if (editId) {
      list = list.map((i: any) =>
        i.id === editId ? { ...i, ...productData } : i
      );
    } else {
      list.push({
        id: Date.now().toString(),
        ...productData,
        createdAt: new Date().toISOString(),
      });
    }

    localStorage.setItem("shopping-list", JSON.stringify(list));
    router.push("/inventory");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-10 text-black">
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
        {/* 基本情報 */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
              <Factory size={12} /> ブランド・メーカー名
            </label>
            <input
              type="text"
              placeholder="例: 雪印メグミルク"
              className="w-full p-3 bg-gray-50 rounded-2xl outline-none text-sm font-bold"
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
              className="w-full p-3 bg-gray-50 rounded-2xl outline-none text-sm font-bold"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* 店舗選択（マスタ登録済み店舗のみ表示） */}
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
          {shops.length === 0 && (
            <p className="text-[10px] text-red-400 mt-1 font-bold">
              ※店舗が登録されていません。上のボタンから追加してください。
            </p>
          )}
        </div>

        {/* 単位選択（チップ式） */}
        <div>
          <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">
            単位
          </label>
          <div className="grid grid-cols-4 gap-2">
            {unitOptions.map((opt) => (
              <button
                key={opt}
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
              className="w-full mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-600 outline-none animate-in zoom-in-95"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
            />
          )}
        </div>

        {/* 内容量・サイズ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase tracking-widest flex items-center gap-1">
              <Scale size={12} /> 内容量
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="1000"
                className="w-full p-3 bg-gray-50 rounded-2xl text-sm font-bold pr-12"
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

        {/* パック入り数（パック選択時のみ表示） */}
        {unit === "パック" && (
          <div className="animate-in zoom-in-95 duration-200 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <label className="text-[10px] font-black text-blue-600 mb-2 block uppercase flex items-center gap-1">
              <Package size={12} /> 1パックあたりの入り数
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                className="w-20 p-2 bg-white rounded-xl outline-none text-center font-black text-blue-600 shadow-sm"
                value={quantityInPack}
                onChange={(e) => setQuantityInPack(e.target.value)}
              />
              <span className="text-xs font-black text-blue-600">
                個入り / パック
              </span>
            </div>
          </div>
        )}

        {/* 価格・在庫 */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-red-500 mb-1 block uppercase tracking-widest">
                税抜き価格 *
              </label>
              <input
                type="number"
                className="w-full p-3 bg-red-50 text-red-600 font-black rounded-2xl text-lg outline-none"
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
              <div className="flex items-center bg-gray-50 rounded-2xl h-[52px] overflow-hidden">
                <button
                  onClick={() => setStock(Math.max(0, stock - 1))}
                  className="flex-1 font-bold text-xl active:bg-gray-200"
                >
                  -
                </button>
                <span className="flex-1 text-center font-black">{stock}</span>
                <button
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
          className="w-full bg-blue-600 text-white py-4 rounded-[24px] font-black text-lg shadow-lg shadow-blue-100 active:scale-95 transition-all mt-4"
        >
          保存する
        </button>
      </div>
    </main>
  );
}

export default function AddProductPage() {
  return (
    <Suspense>
      <AddProductForm />
    </Suspense>
  );
}
