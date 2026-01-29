import { useEffect, useMemo, useState } from "react";
import {useNavigate, useParams } from "react-router";
import DynamicHeader from "@/react-app/components/DynamicHeader";
import Sidebar from "@/react-app/components/Sidebar";
import FeaturedSection from "@/react-app/components/FeaturedSection";
import OptimizedImage from "@/react-app/components/OptimizedImage";
import { ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react";
import { Product, Category } from "@/shared/types";
import { useCart } from "@/react-app/hooks/useCart";

export default function ProductPage() {
    const { id } = useParams();
    const productId = useMemo(() => Number(id), [id]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // (opcional) só pra Sidebar ter as categorias e não quebrar UX
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const { addToCart, items, updateQuantity, removeFromCart } = useCart();
    const [qty, setQty] = useState(1);
    const [isAdding, setIsAdding] = useState(false);

    const cartItem = product ? items.find((i) => i.product.id === product.id) : undefined;
    const cartQty = cartItem ? cartItem.quantity : 0;

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

    const hasDiscount = !!product?.original_price && product.original_price > product.price;
    const discountPct =
        product && hasDiscount
            ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
            : 0;

    const installments = useMemo(() => {
        if (!product) return null;
        const n = 6;
        const per = product.price / n;
        const perFmt = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
        }).format(per);
        return { n, perFmt };
    }, [product]);

    useEffect(() => {
        // categorias (opcional)
        (async () => {
            try {
                const r = await fetch("/api/categories");
                const d = await r.json();
                setCategories(d.categories || []);
            } catch (e) {
                console.error("ProductPage: erro ao carregar categorias", e);
                setCategories([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (!productId || Number.isNaN(productId)) {
            setProduct(null);
            setLoading(false);
            return;
        }

        let alive = true;

        (async () => {
            try {
                setLoading(true);
                const r = await fetch(`/api/products/${productId}`);

                if (!r.ok) {
                    if (!alive) return;
                    setProduct(null);
                    return;
                }

                const d = await r.json();
                if (!alive) return;

                setProduct(d.product ?? null);

                // deixa a categoria selecionada pra Sidebar (se existir)
                const cid = d.product?.category_id ? Number(d.product.category_id) : null;
                setSelectedCategory(cid);
            } catch (e) {
                console.error("ProductPage: erro ao carregar produto", e);
                if (!alive) return;
                setProduct(null);
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [productId]);

    const handleCategorySelect = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        // aqui você decide: navegar pra Home filtrando ou só fechar sidebar
        setSidebarOpen(false);
    };

    const addNow = async () => {
        if (!product) return;
        setIsAdding(true);
        try {
            addToCart(product, qty);
        } finally {
            setTimeout(() => setIsAdding(false), 350);
        }
    };

    const incCart = () => {
        if (!product) return;
        updateQuantity(product.id, cartQty + 1);
    };

    const decCart = () => {
        if (!product) return;
        if (cartQty > 1) updateQuantity(product.id, cartQty - 1);
        else removeFromCart(product.id);
    };
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-50">
            <DynamicHeader onMenuToggle={() => setSidebarOpen(true)} />

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
            />
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar
            </button>
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                        <div className="h-6 w-64 bg-gray-200 rounded" />
                        <div className="mt-4 h-[420px] bg-gray-100 rounded-xl" />
                        <div className="mt-4 h-4 w-96 bg-gray-100 rounded" />
                        <div className="mt-2 h-4 w-72 bg-gray-100 rounded" />
                    </div>
                ) : !product ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8">
                        <h1 className="text-2xl font-extrabold text-black">Produto não encontrado</h1>
                        <p className="mt-2 text-gray-600">Esse item pode ter sido removido ou está inativo.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                                {/* IMAGEM */}
                                <div className="relative bg-white">
                                    <div className="aspect-[3/4] w-full">
                                        <OptimizedImage
                                            src={product.image_url || ""}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-10"
                                            fallbackIcon={<ShoppingCart className="w-16 h-16 text-gray-300" />}
                                            loading="lazy"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        />
                                    </div>

                                    {hasDiscount && (
                                        <div className="absolute top-4 left-4 bg-[#ff0080] text-white text-sm font-extrabold px-3 py-1.5 rounded-full">
                                            -{discountPct}%
                                        </div>
                                    )}
                                </div>

                                {/* INFO */}
                                <div className="p-6 md:p-8">
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-black leading-tight">
                                        {product.name}
                                    </h1>

                                    {product.description ? (
                                        <p className="mt-4 text-[16px] md:text-[17px] text-gray-700 leading-relaxed">
                                            {product.description}
                                        </p>
                                    ) : null}

                                    {hasDiscount ? (
                                        <div className="mt-6 text-gray-400 line-through text-xl font-semibold">
                                            {formatPrice(product.original_price!)}
                                        </div>
                                    ) : (
                                        <div className="mt-6" />
                                    )}

                                    <div className="mt-1 flex items-end gap-3 flex-wrap">
                                        <div className="text-3xl font-extrabold text-black">
                                            {formatPrice(product.price)}
                                        </div>

                                        {installments ? (
                                            <div className="text-base text-gray-700">
                                                ou <span className="font-semibold">{installments.n}x</span>{" "}
                                                <span className="font-semibold">{installments.perFmt}</span>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* CONTROLES */}
                                    {cartQty === 0 ? (
                                        <>
                                            <div className="mt-6 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setQty((p) => (p > 1 ? p - 1 : p))}
                                                    className="h-11 w-11 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                    aria-label="Diminuir"
                                                >
                                                    <Minus className="w-5 h-5" />
                                                </button>

                                                <span className="min-w-[36px] text-center font-extrabold text-lg">
                                                    {qty}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => setQty((p) => p + 1)}
                                                    className="h-11 w-11 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                    aria-label="Aumentar"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="mt-6 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={addNow}
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
                                                    onClick={() => addToCart(product, 1)}
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
                                            <div className="mt-6 flex items-center justify-between rounded-xl border border-[#ff0080]/30 bg-[#ff0080]/5 px-4 py-3">
                                                <span className="text-sm font-semibold text-[#ff0080]">
                                                    No carrinho
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={decCart}
                                                        className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                                                        aria-label="Diminuir do carrinho"
                                                    >
                                                        <Minus className="w-5 h-5" />
                                                    </button>

                                                    <span className="min-w-[32px] text-center font-extrabold text-lg">
                                                        {cartQty}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={incCart}
                                                        className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                                                        aria-label="Aumentar do carrinho"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(product, 1)}
                                                    className="flex-1 h-14 rounded-xl font-extrabold text-white text-lg bg-[#ff0080] hover:brightness-95 transition"
                                                >
                                                    Comprar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={incCart}
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
                            </div>
                        </div>

                        {/* Recomendações */}
                        <FeaturedSection
                            title="você também pode gostar"
                            subtitle="selecionados pra combinar com o seu pedido"
                            categoryId={Number((product as any).category_id) || undefined}
                            limit={10}
                            className="mt-8"
                        />
                    </>
                )}
            </main>
        </div>
    );
}
