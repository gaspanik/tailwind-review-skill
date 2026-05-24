// Reactコンポーネント: ハードコードされた色・任意値あり
// @theme に --color-primary: #1e40af, --color-accent: #f59e0b が定義済み想定

interface CardProps {
  title: string;
  description: string;
  price: number;
}

export function ProductCard({ title, description, price }: CardProps) {
  return (
    <div className="w-[320px] rounded-lg border border-[#e5e7eb] shadow-sm p-6">
      <h2 className="text-[18px] font-bold text-[#1e40af] mb-2">{title}</h2>
      <p className="text-gray-600 text-[14px] leading-relaxed mb-4">{description}</p>
      <div className="flex flex-row items-center justify-between">
        <span className="text-[#f59e0b] font-semibold text-[20px]">
          ¥{price.toLocaleString()}
        </span>
        <button className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-[14px] px-4 py-2 rounded-md">
          カートに追加
        </button>
      </div>
    </div>
  );
}

// style.css の @theme:
// @theme {
//   --color-primary: #1e40af;
//   --color-accent: #f59e0b;
// }
