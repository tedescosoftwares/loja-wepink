import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Product } from "@/shared/types";
import { useCart } from "@/react-app/hooks/useCart";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import OptimizedImage from "./OptimizedImage";
import DynamicDiscountNotification from "./DynamicDiscountNotification";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showDiscountNotification, setShowDiscountNotification] = useState(false);

  const cartItem = items.find((item) => item.product.id === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  // (temporário) 6x como no print
  const installments = useMemo(() => {
    const n = 6;
    const per = product.price / n;
    const perFmt = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(per);
    return { n, perFmt };
  }, [product.price]);

  const hasDiscount = !!product.original_price && product.original_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  // rota de detalhe (ajusta aqui se sua rota for outra)
  const goToProduct = () => {
    navigate(`/produto/${product.id}`);
  };

  // helper pra impedir que clique nos botões dispare a navegação do card
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) stop(e);

    setIsAdding(true);
    try {
      addToCart(product, quantity);
      setShowDiscountNotification(true);
      setTimeout(() => setShowDiscountNotification(false), 8000);
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setTimeout(() => setIsAdding(false), 450);
    }
  };

  const handleQuantityIncrease = (e: React.MouseEvent) => {
    stop(e);
    setQuantity((p) => p + 1);
  };

  const handleQuantityDecrease = (e: React.MouseEvent) => {
    stop(e);
    setQuantity((p) => (p > 1 ? p - 1 : p));
  };

  const handleCartQuantityIncrease = (e: React.MouseEvent) => {
    stop(e);
    updateQuantity(product.id, cartQuantity + 1);
  };

  const handleCartQuantityDecrease = (e: React.MouseEvent) => {
    stop(e);
    if (cartQuantity > 1) updateQuantity(product.id, cartQuantity - 1);
    else removeFromCart(product.id);
  };

  const addOne = (e: React.MouseEvent) => {
    stop(e);
    addToCart(product, 1);
  };

  return (
    <>
      {showDiscountNotification && (
        <DynamicDiscountNotification
          productId={product.id}
          productName={product.name}
          onClose={() => setShowDiscountNotification(false)}
        />
      )}

      {/* CARD CLICÁVEL */}
      <button
        type="button"
        onClick={goToProduct}
        className="text-left w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-[#ff0080]/40"
        aria-label={`Abrir produto: ${product.name}`}
      >
        {/* IMAGEM */}
        <div className="relative bg-white">
          <div className="aspect-[3/4] w-full">
            <OptimizedImage
              src={product.image_url || ""}
              alt={product.name}
              className="w-full h-full object-contain p-6"
              fallbackIcon={<ShoppingCart className="w-16 h-16 text-gray-300" />}
              loading="lazy"
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>

          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-[#ff0080] text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discountPct}%
            </div>
          )}
        </div>

        {/* CONTEÚDO */}
        <div className="px-5 pb-5">
          <h3 className="text-[20px] leading-snug font-extrabold text-black line-clamp-2">
            {product.name}
          </h3>

          {product.description ? (
            <p className="mt-2 text-[15px] text-gray-700 line-clamp-2">
              {product.description}
            </p>
          ) : null}

          {/* preço antigo */}
          {hasDiscount ? (
            <div className="mt-3 text-gray-400 line-through text-lg font-semibold">
              {formatPrice(product.original_price!)}
            </div>
          ) : (
            <div className="mt-3" />
          )}

          {/* preço atual + parcelas */}
          <div className="mt-1 flex items-end gap-2 flex-wrap">
            <div className="text-2xl font-extrabold text-black">
              {formatPrice(product.price)}
            </div>

            <div className="text-sm text-gray-700">
              ou <span className="font-semibold">{installments.n}x</span>{" "}
              <span className="font-semibold">{installments.perFmt}</span>
            </div>
          </div>

          {/* CONTROLES (CLIQUE AQUI NÃO NAVEGA) */}
          {cartQuantity === 0 ? (
            <>
              <div className="mt-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuantityDecrease}
                    className="h-9 w-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Diminuir"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="min-w-[28px] text-center font-semibold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={handleQuantityIncrease}
                    className="h-9 w-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Aumentar"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={[
                    "flex-1 h-14 rounded-xl font-extrabold text-white text-lg",
                    "bg-[#ff0080] hover:brightness-95 active:brightness-90 transition",
                    isAdding ? "opacity-80" : "",
                  ].join(" ")}
                >
                  {isAdding ? "Adicionando..." : "Comprar"}
                </button>

                <button
                  type="button"
                  onClick={addOne}
                  className="h-14 w-14 rounded-xl border-2 border-[#ff0080] text-[#ff0080] flex items-center justify-center hover:bg-[#ff0080]/10 transition"
                  title="Adicionar 1"
                  aria-label="Adicionar 1"
                >
                  <ShoppingCart className="w-6 h-6" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[#ff0080]/30 bg-[#ff0080]/5 px-4 py-3">
                <span className="text-sm font-semibold text-[#ff0080]">
                  No carrinho
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCartQuantityDecrease}
                    className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Diminuir do carrinho"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="min-w-[28px] text-center font-extrabold">
                    {cartQuantity}
                  </span>

                  <button
                    type="button"
                    onClick={handleCartQuantityIncrease}
                    className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Aumentar do carrinho"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 h-14 rounded-xl font-extrabold text-white text-lg bg-[#ff0080] hover:brightness-95 transition"
                >
                  {isAdding ? "Adicionando..." : "Comprar"}
                </button>

                <button
                  type="button"
                  onClick={handleCartQuantityIncrease}
                  className="h-14 w-14 rounded-xl border-2 border-[#ff0080] text-[#ff0080] flex items-center justify-center hover:bg-[#ff0080]/10 transition"
                  title="Adicionar +1"
                  aria-label="Adicionar +1"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </button>
    </>
  );
}
