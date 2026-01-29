import { ChevronUp } from "lucide-react";

type SocialLink = { label: string; href: string; icon: React.ReactNode };

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5zM17.8 6.2a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.3-1.5 1.6-1.5H16.8V5.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V11H7.2v3h2.6v8h3.7z" />
    </svg>
  );
}

function IconYoutube() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.5 12 4.5 12 4.5s-5.7 0-7.5.6A3 3 0 0 0 2.4 7.2 31.4 31.4 0 0 0 2 12a31.4 31.4 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.6 7.5.6 7.5.6s5.7 0 7.5-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 22 12a31.4 31.4 0 0 0-.4-4.8zM10 15.2V8.8L16 12l-6 3.2z" />
    </svg>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <div className="h-10 w-16 rounded-md border-2 border-white/90 flex items-center justify-center">
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </div>
  );
}

export default function FooterWepink() {
  const links = [
    "sobre nós",
    "central de ajuda",
    "solicitação de troca",
    "solicitação de devolução",
    "canais de atendimento",
    "regulamentos",
    "trabalhe conosco",
    "cadê meu pedido",
    "franquias",
    "nossas lojas",
    "T&C",
  ];

  const socials: SocialLink[] = [
    { label: "Instagram", href: "#", icon: <IconInstagram /> },
    { label: "Facebook", href: "#", icon: <IconFacebook /> },
    { label: "YouTube", href: "#", icon: <IconYoutube /> },
  ];

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-[#ff0080] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* COLUNA 1: logo + links */}
          <div>
            <div className="text-4xl font-extrabold tracking-tight mb-8">
              wepink
            </div>

            <ul className="space-y-4 text-base">
              {links.map((t) => (
                <li key={t}>
                  <a
                    href="#"
                    className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity"
                  >
                    <span className="capitalize">{t}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUNA 2: socials + voltar ao topo */}
          <div className="flex flex-col items-center lg:items-center gap-10">
            <div className="flex items-center gap-8">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-14 w-14 rounded-full bg-white text-[#ff0080] flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={goTop}
              className="inline-flex items-center gap-4 text-lg hover:opacity-90 transition-opacity"
            >
              <span className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronUp className="w-5 h-5" />
              </span>
              <span>voltar ao topo</span>
            </button>
          </div>

          {/* COLUNA 3: formas de pagamento */}
          <div className="lg:justify-self-end">
            <h3 className="text-2xl font-bold mb-8">Formas de pagamento</h3>

            <div className="flex flex-wrap gap-4 justify-start lg:justify-end">
              <PaymentBadge label="VISA" />
              <PaymentBadge label="mastercard" />
              <PaymentBadge label="ELO" />
              <PaymentBadge label="AMEX" />
            </div>

            <div className="mt-8 flex flex-col items-start lg:items-end gap-3">
              {/* “Pix” estilizado simples (depois você troca por svg real se quiser) */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-white/90 flex items-center justify-center">
                  <span className="text-sm font-bold">◆</span>
                </div>
                <span className="text-xl">Pix</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
