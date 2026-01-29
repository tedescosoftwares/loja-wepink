import { ShoppingCart, Menu, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/react-app/hooks/useCart';
import { useNavigate } from 'react-router';
import Cart from './Cart';

interface HeaderProps {
  onMenuToggle: () => void;
}

interface SiteSettings {
  site_name?: string;
  site_logo_url?: string;
  site_logo_text?: string;
  site_logo_link?: string;
}


type TopSliderProps = {
  frases: string[];
  holdMs?: number;
  moveMs?: number;
  gapMs?: number;
};

export function TopSlider({
  frases,
  holdMs = 5000,
  moveMs = 260,
  gapMs = 0,
}: TopSliderProps) {
  const safe = useMemo(() => frases?.filter(Boolean) ?? [], [frases]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "anim">("idle");

  useEffect(() => {
    if (safe.length <= 1) return;

    let t1: any;
    let t2: any;

    t1 = setTimeout(() => {
      setPhase("anim");

      t2 = setTimeout(() => {
        setIdx((p) => (p + 1) % safe.length);
        setPhase("idle");
      }, moveMs);
    }, holdMs + gapMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [idx, safe.length, holdMs, moveMs, gapMs]);

  if (!safe.length) return null;

  const current = safe[idx];
  const next = safe[(idx + 1) % safe.length];

  return (
    <div className="sticky top-0 z-50 bg-[#ff0080] text-white ">
      <div className="relative overflow-hidden min-h-[40px] px-3 py-2">
        {/* ATUAL (sai pra esquerda) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: phase === "anim" ? "translateX(-120%)" : "translateX(0%)",
            transition: phase === "anim" ? `transform ${moveMs}ms ease-in` : "none",
            willChange: "transform",
          }}
        >
          <span
            className="
              text-[13px] sm:text-sm font-normal text-center
              w-full max-w-[92vw] sm:max-w-3xl
              whitespace-normal break-words leading-snug
              line-clamp-2
            "
          >
            {current}
          </span>
        </div>

        {/* PRÓXIMA (entra da direita -> centro) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: phase === "anim" ? "translateX(0%)" : "translateX(120%)",
            transition: phase === "anim" ? `transform ${moveMs}ms ease-out` : "none",
            willChange: "transform",
          }}
        >
          <span
            className="
            p-8
              text-[13px] sm:text-sm font-semibold text-center
              w-full max-w-[92vw] sm:max-w-3xl
              whitespace-normal break-words leading-snug
              line-clamp-2
            "
          >
            {next}
          </span>
        </div>
      </div>
    </div>
  );
}
export default function DynamicHeader({ onMenuToggle }: HeaderProps) {
  const [showCart, setShowCart] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.settings) {
        const settingsMap: SiteSettings = {};
        data.settings.forEach((setting: any) => {
          settingsMap[setting.setting_key as keyof SiteSettings] = setting.setting_value || '';
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
      // Fallback to default
      setSettings({
        site_name: '',
        site_logo_text: '3242342',
        site_logo_url: 'https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/4.0.4/svg/logo-primary___ef05671065928b5b01f33e72323ba3b8.svg'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLogo = () => {
    if (loading) {
      return (
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
      );
    }

    const logoContent = () => {
      if (settings.site_logo_url && settings.site_logo_url.trim()) {
        return (
          <div className="flex items-center">
            <img
              src={settings.site_logo_url}
              alt={settings.site_name || 'Logo'}
              className="h-10 max-w-48 object-contain"
              onError={(e) => {
                // Fallback to text if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.logo-fallback');
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
            <h1 className="text-2xl font-bold text-blue-600 logo-fallback hidden">
              {settings.site_logo_text || 'xx'}
            </h1>
          </div>
        );
      }

      return (

        <div className="flex items-center gap-2">
          <img
            src="https://wepink.vtexassets.com/assets/vtex/assets-builder/wepink.store-theme/4.0.4/svg/logo-primary___ef05671065928b5b01f33e72323ba3b8.svg"
            alt={settings.site_name || "Logo"}
            className="h-7 md:h-9 w-auto max-w-[180px] object-contain"
          />
          <h1 className="text-2xl font-bold text-pink-600">
            {settings.site_logo_text || ""}
          </h1>
        </div>
      );
    };

    // If there's a logo link, wrap in a clickable element
    if (settings.site_logo_link && settings.site_logo_link.trim()) {
      const isExternalLink = settings.site_logo_link.startsWith('http');

      if (isExternalLink) {
        return (
          <a
            href={settings.site_logo_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:opacity-80 transition-opacity"
          >
            {logoContent()}
          </a>
        );
      } else {
        return (
          <button
            onClick={() => navigate(settings.site_logo_link!)}
            className="block hover:opacity-80 transition-opacity focus:outline-none"
          >
            {logoContent()}
          </button>
        );
      }
    }

    // No link, just return the logo content
    return logoContent();
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const frasesTopo = [
    "Garanta agora o seu we kit favorito! ",
    "Fique ligado! A inclusão do produto na cesta não garante sua compra. Finalize o carrinho!",
    "Toda loja com 30% Off use o cupom WEPINK30",
    "Atendimento no WhatsApp 📲",
  ];

  return (
    <>
      <TopSlider frases={frasesTopo} holdMs={5000} moveMs={260} />
      <header
        className={[
          "sticky top-10 z-40 border-b shadow-sm transition-all duration-200",
          scrolled
            ? "bg-white/70 backdrop-blur-md border-white/20"
            : "bg-white border-transparent"
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 grid grid-cols-3 items-center md:flex md:items-center md:justify-between">
            {/* MOBILE: esquerda (menu) */}
            <div className="flex items-center md:hidden">
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* MOBILE: centro (logo) */}
            <div className="flex justify-center md:hidden">
              {renderLogo()}
            </div>

            {/* MOBILE: direita (carrinho) */}
            <div className="flex justify-end md:hidden">
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                title="Abrir carrinho"
              >
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>

            {/* DESKTOP: layout normal (logo esquerda, search centro, carrinho direita) */}
            <div className="hidden md:flex md:items-center md:justify-between md:w-full">
              {/* esquerda: logo */}
              <div className="flex items-center">
                {renderLogo()}
              </div>

              {/* centro: search */}
              <div className="flex-1 max-w-lg mx-8">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-pink-700 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Buscar produtos..."
                  />
                </div>
              </div>

              {/* direita: carrinho */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                  title="Abrir carrinho"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </header>

      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
