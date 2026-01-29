import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/shared/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  categoryId?: number;
  limit?: number;
  productIds?: number[];
  className?: string;
};

export default function FeaturedSection({
  title,
  subtitle,
  categoryId,
  limit = 10,
  productIds,
  className = "",
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/products");
        const d = await r.json();
        if (!alive) return;
        setProducts(d.products || []);
      } catch (e) {
        console.error("FeaturedSection: erro ao carregar produtos", e);
        if (!alive) return;
        setProducts([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = products;

    if (productIds?.length) {
      const set = new Set(productIds.map(Number));
      const only = list.filter((p: any) => set.has(Number(p.id)));
      list = productIds
        .map((id) => only.find((p: any) => Number(p.id) === Number(id)))
        .filter(Boolean) as Product[];
    }

    if (categoryId) {
      list = list.filter((p: any) => Number(p.category_id) === Number(categoryId));
    }

    return list.slice(0, limit);
  }, [products, productIds, categoryId, limit]);

  if (!filtered.length) return null;

  const scrollByCards = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;

    // rola 2 cards por clique no desktop
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth * 2 + 16 : 600;

    el.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <section className={["max-w-7xl mx-auto py-8", className].join(" ")}>
      {/* padding fica no CONTAINER, não no scroller */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-5">
          <h2 className="text-2xl md:text-5xl font-bold text-[#ff0080] tracking-tight">
            {title}
          </h2>
          {subtitle ? <p className="mt-2 text-sm md:text-base text-gray-700">{subtitle}</p> : null}
        </div>

        <div className="relative">
          {/* Setas (desktop) */}
          <button
            type="button"
            onClick={() => scrollByCards("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10
                       w-10 h-10 rounded-full bg-white/90 border border-gray-200 shadow
                       items-center justify-center hover:bg-white"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            type="button"
            onClick={() => scrollByCards("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10
                       w-10 h-10 rounded-full bg-white/90 border border-gray-200 shadow
                       items-center justify-center hover:bg-white"
            aria-label="Avançar"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Carrossel */}
          <div
            ref={scrollerRef}
            className="
              flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory
              pb-3
              px-0
              md:px-12
              [scrollbar-width:none] [-ms-overflow-style:none]
            "
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {filtered.map((p: any) => (
              <div
                key={Number(p.id)}
                data-card
                className="
                  snap-start shrink-0 min-w-0
                  basis-[calc((100%-16px)/2)]      /* mobile: 2 certinho */
                  md:basis-[calc((100%-48px)/4)]   /* desktop: 4 certinho (3 gaps = 48px) */
                "
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

