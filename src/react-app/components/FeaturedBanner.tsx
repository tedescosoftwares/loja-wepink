import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Product } from "@/shared/types";

type Props = {
  productId: number;
  tag?: string;
  subline?: string;
  buttonText?: string;
  className?: string;
  imageOverrideUrl?: string;
};

export default function FeaturedBanner({
  productId,
  tag = "#destaque do mês",
  subline = "lapidado para impactar!",
  buttonText = "eu quero!",
  className = "",
  imageOverrideUrl,
}: Props) {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        const url = `/api/products/${productId}`;
        console.log("[FeaturedBanner] fetching:", url);

        const r = await fetch(url);
        const d = await r.json().catch(() => ({}));

        console.log("[FeaturedBanner] status:", r.status, "payload:", d);

        if (!alive) return;

        if (!r.ok) {
          setProduct(null);
          setErrMsg(d?.error || `Erro ao buscar produto (${r.status})`);
          return;
        }

        setProduct(d.product || null);
        if (!d.product) setErrMsg("Resposta sem produto (d.product veio vazio).");
      } catch (e: any) {
        console.error("[FeaturedBanner] fetch error:", e);
        if (!alive) return;
        setProduct(null);
        setErrMsg("Falha de rede ao buscar o produto.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [productId]);

  const goToProduct = () => navigate(`/produto/${productId}`);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  // ✅ SEMPRE RENDERIZA ALGUMA COISA
  return (
    <div className={["w-full", className].join(" ")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={goToProduct}
          className="
            w-full text-left
            grid grid-cols-1 md:grid-cols-2
            rounded-2xl overflow-hidden
            shadow-md hover:shadow-lg transition-shadow
            bg-white
            focus:outline-none focus:ring-2 focus:ring-[#ff0080]/40
          "
          aria-label="Abrir produto em destaque"
        >
          {/* IMAGEM */}
          <div className="bg-white flex items-center justify-center p-6 md:p-10 min-h-[280px]">
            {loading ? (
              <div className="w-full h-[260px] bg-gray-200 animate-pulse rounded-xl" />
            ) : (
              <img
                src={imageOverrideUrl || product?.image_url || ""}
                alt={product?.name || "Destaque"}
                className="max-h-[260px] md:max-h-[340px] w-auto object-contain"
                draggable={false}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}

            {!loading && !(imageOverrideUrl || product?.image_url) ? (
              <div className="w-full h-[260px] bg-gray-100 rounded-xl" />
            ) : null}
          </div>

          {/* PAINEL ROSA */}
          <div className="bg-[#ff0080] text-white p-8 md:p-12 flex flex-col justify-center min-h-[280px]">
            <div className="text-lg md:text-xl font-bold opacity-95">{tag}</div>

            <h3 className="mt-6 text-2xl md:text-4xl font-extrabold leading-tight">
              {loading ? "Carregando produto..." : product?.name || "Produto não carregou"}
            </h3>

            <p className="mt-6 text-lg md:text-xl opacity-90">
              {loading ? "Aguarde..." : subline}
            </p>

            <div className="mt-10 text-2xl md:text-3xl font-extrabold">
              {loading ? "—" : product ? formatPrice(product.price) : "—"}
            </div>

            {errMsg ? (
              <div className="mt-4 text-sm bg-white/15 rounded-lg px-3 py-2">
                {errMsg}
              </div>
            ) : null}

            <div className="mt-8">
              <span
                className="
                  inline-flex items-center justify-center
                  px-10 py-4
                  rounded-xl
                  border border-white/80
                  hover:bg-white/10 transition
                  text-lg font-semibold
                "
              >
                {buttonText}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
