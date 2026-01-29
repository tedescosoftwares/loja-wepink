import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Category } from "@/shared/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  selectedCategory,
  onCategorySelect,
}: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // mesmo “bg” do header (f7f7f7 + transparência + blur)
  const glassBg =
    "bg-[#f7f7f7]/70 backdrop-blur-md border-b border-white/30";

  return (
    <>
      {/* Overlay só no mobile quando aberto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop: sticky (não fixed) | Mobile: vira fixed quando aberto */}
      <div
        className={[
          "w-full",
          glassBg,

          // desktop normal
          "md:sticky md:top-[104px] md:z-30 md:relative",

          // mobile sempre fixed (não entra no fluxo, não cria espaço)
          "fixed left-0 top-0 z-50 md:static",

          // animação
          "transform transition-transform duration-300 ",
          isOpen ? "translate-y-0 pointer-events-auto" : "-translate-y-full pointer-events-none md:translate-y-0 md:pointer-events-auto",
                 
        ].join(" ")}
      >
        {/* Header mobile com botão fechar */}
        <div className="px-4 py-3 border-b border-white/30 md:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Categorias</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/40"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>

        <div className="px-3 py-3">
          {loading ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-28 bg-white/40 rounded-full  animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
              <button
                type="button"
                onClick={() => onCategorySelect(null)}
                className={[
                  "shrink-0 px-4 py-2 rounded-full transition-colors font-light text-sm",
                  "border border-white/30",
                  selectedCategory === null
                    ? "bg-white/70 text-pink-700 shadow-sm font-light"
                    : "bg-white/35 hover:bg-white/55 text-gray-800 ",
                ].join(" ")}
              >
                Todos
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategorySelect(category.id)}
                  className={[
                    "shrink-0 px-4 py-2 rounded-full transition-colors font-thin text-[20px]",
                    "border border-white/30",
                    selectedCategory === category.id
                      ? "bg-white/70 text-pink-700 shadow-sm"
                      : "bg-white/35 hover:bg-white/55 text-gray-800",
                  ].join(" ")}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
