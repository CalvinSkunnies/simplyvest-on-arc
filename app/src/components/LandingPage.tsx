import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "../wallet";
import ThemeToggle from "./ThemeToggle";

const FEATURES = [
  {
    title: "Time Streams",
    desc: "Linear token vesting with configurable cliff and duration. Tokens unlock continuously from start to end.",
  },
  {
    title: "Milestone Streams",
    desc: "Event-gated token release. A designated authority triggers the milestone — then the recipient claims in full.",
  },
  {
    title: "Cancel Anytime",
    desc: "Creators can cancel a stream at any point before expiry. Vested tokens go to recipient, remainder returns.",
  },
  {
    title: "Fully On-Chain",
    desc: "Every vesting schedule, withdrawal, and cancellation is recorded on Arc Testnet. No off-chain state.",
  },
  {
    title: "No Arbitrator",
    desc: "Trust-minimized design. The contract enforces the schedule — no intermediary, no dispute needed.",
  },
  {
    title: "Push-Based Claims",
    desc: "Recipients withdraw directly. No need to wait for the creator to release each payment.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is a time-based vesting stream?",
    a: "A time stream releases tokens linearly over a set duration, with an optional cliff. The recipient can withdraw any vested portion at any time after the cliff is reached.",
  },
  {
    q: "What is a milestone stream?",
    a: "A milestone stream locks the full amount until a designated authority triggers release. Once triggered, the recipient can claim the entire amount in one transaction.",
  },
  {
    q: "Can I cancel a stream?",
    a: "Yes — the creator can cancel any active stream before its end time. Vested tokens are sent to the recipient, and the unvested remainder is returned to the creator.",
  },
  {
    q: "What happens if I withdraw nothing?",
    a: "The contract rejects zero-amount withdrawals and zero-amount stream creation. Every transaction must move a non-zero amount of USDC.",
  },
  {
    q: "Which tokens can I use?",
    a: "Currently SimplyVest supports USDC on Arc Testnet. USDC is both the gas token and the settlement currency — one token is all you need.",
  },
  {
    q: "Is there a minimum duration?",
    a: "Yes — streams must be at least 60 seconds long. The maximum allowed duration is 10 years.",
  },
];

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const walletConnected = !!address;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleLaunch = () => {
    if (!address) connect();
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 glass border-b border-base-500/20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="SimplyVest" className="h-8" />
            <span className="text-lg font-display font-bold tracking-tight">
              <span className="text-text-primary">Simply</span>
              <span className="text-plum-400">Vest</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#how" className="text-text-secondary text-sm hover:text-text-primary transition-colors">
              How it works
            </a>
            <a href="#features" className="text-text-secondary text-sm hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#faq" className="text-text-secondary text-sm hover:text-text-primary transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {walletConnected ? (
              <button onClick={handleLaunch} className="btn-primary text-sm px-5 py-2">
                Launch App
              </button>
            ) : (
              <button onClick={handleLaunch} className="btn-primary text-sm px-5 py-2">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-plum-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-plum-800/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-plum-800/30 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-base-700/50 border border-base-500/30 mb-8">
              <span className="w-2 h-2 rounded-full bg-plum-400 animate-pulse" />
              <span className="text-text-muted text-xs font-medium tracking-wide">
                Live on Arc Testnet
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 leading-[1.1]">
              <span className="text-text-primary">Vesting streams,</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-plum-400 to-plum-200">
                enforced on-chain.
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal>
            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Time-based and milestone-gated token vesting on Arc Testnet.
              Create a stream, set a schedule, and let the contract handle the rest —
              no intermediaries, no trust required.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button onClick={handleLaunch} className="btn-primary text-lg px-10 py-4 animate-pulse-glow">
                {walletConnected ? "Launch App →" : "Connect Wallet"}
              </button>
              <a href="#how" className="btn-secondary text-lg px-8 py-4">
                How it works
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex items-center justify-center gap-3 mt-8 text-text-muted text-xs">
              <span>Time streams</span>
              <span className="w-1 h-1 rounded-full bg-base-500" />
              <span>Milestone streams</span>
              <span className="w-1 h-1 rounded-full bg-base-500" />
              <span>Cancel anytime</span>
              <span className="w-1 h-1 rounded-full bg-base-500" />
              <span>100% on-chain</span>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16">
              {[
                ["USDC", "Native gas & settlement"],
                ["< 1 sec", "Arc finality"],
                ["0%", "Intermediaries"],
                ["100%", "On-chain"],
              ].map(([val, label]) => (
                <div key={label} className="text-center p-4 rounded-2xl bg-base-800/40 border border-base-500/20">
                  <div className="text-2xl font-bold font-display text-plum-300">{val}</div>
                  <div className="text-text-muted text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </header>

      {/* ── How It Works ── */}
      <section id="how" className="py-24 border-t border-base-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-text-primary mb-4">
              How it works
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-text-secondary text-center max-w-xl mx-auto mb-16">
              Three simple steps to create and manage a vesting stream.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: "1",
                title: "Create a Stream",
                desc: "Choose between a time-based or milestone stream. Set the recipient, token, amount, and schedule.",
              },
              {
                step: "2",
                title: "Fund & Set Rules",
                desc: "Deposit USDC into the contract. For time streams, set start, cliff, and end dates. For milestones, assign an authority.",
              },
              {
                step: "3",
                title: "Recipient Claims",
                desc: "Tokens vest automatically. The recipient withdraws at any time — no permission needed after creation.",
              },
            ].map(({ step, title, desc }, i) => (
              <ScrollReveal key={step}>
                <div className="relative text-center p-8 rounded-2xl bg-bg-card border border-base-500/20 h-full">
                  <div className="w-12 h-12 rounded-xl bg-plum-800/30 border border-plum-800/40 flex items-center justify-center text-plum-300 text-xl font-bold font-display mx-auto mb-5">
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-3">{title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
                </div>
              </ScrollReveal>
            ))}

            <div className="hidden md:block absolute top-1/3 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-plum-800/40 via-plum-600/40 to-plum-800/40 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-bg-card/50 border-t border-base-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-text-primary mb-4">
              Everything you need
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-text-secondary text-center max-w-xl mx-auto mb-16">
              SimplyVest handles the full vesting lifecycle on-chain.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ title, desc }) => (
              <ScrollReveal key={title}>
                <div className="p-6 rounded-2xl bg-bg-card border border-base-500/20 h-full hover:border-plum-800/30 transition-colors">
                  <h3 className="text-base font-semibold font-display text-text-primary mb-2">{title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 border-t border-base-500/10">
        <div className="max-w-3xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-text-primary mb-4">
              Frequently Asked Questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-text-secondary text-center mb-12">
              Everything you need to know about SimplyVest.
            </p>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <ScrollReveal key={i}>
                <div className="rounded-2xl bg-bg-card border border-base-500/20 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-base-700/30"
                  >
                    <span className="text-text-primary font-medium text-sm pr-4">{q}</span>
                    <svg
                      className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <p className="px-5 pb-5 text-text-secondary text-sm leading-relaxed">{a}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-base-500/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-plum-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
              Ready to start vesting?
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-text-secondary text-lg mb-10">
              Connect your wallet and launch the app. No registration, no approval — just Arc Testnet and USDC.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <button onClick={handleLaunch} className="btn-primary text-lg px-10 py-4 animate-pulse-glow">
              {walletConnected ? "Launch App →" : "Connect Wallet"}
            </button>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-base-500/10 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/favicon.svg" alt="SimplyVest" className="h-7" />
                <span className="font-display font-bold text-text-primary">SimplyVest</span>
              </div>
              <p className="text-text-muted text-xs leading-relaxed max-w-xs">
                On-chain vesting streams on Arc Testnet. Open source, trust-minimized, and fully on-chain.
              </p>
            </div>
            <div>
              <h4 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#how" className="text-text-secondary text-sm hover:text-text-primary transition-colors">How it works</a></li>
                <li><a href="#features" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Features</a></li>
                <li><a href="#faq" className="text-text-secondary text-sm hover:text-text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">Developers</h4>
              <ul className="space-y-2">
                <li><a href="https://github.com/CalvinSkunnies/Simplyvest-Arc" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">GitHub</a></li>
                <li><a href="https://github.com/CalvinSkunnies/Simplyvest-Arc/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">README</a></li>
                <li><a href="https://github.com/CalvinSkunnies/Simplyvest-Arc/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Architecture</a></li>
                <li><a href="https://github.com/CalvinSkunnies/Simplyvest-Arc/blob/main/docs/DEPLOYMENT.md" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Deploy Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="https://docs.arc.network" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Arc Docs</a></li>
                <li><a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">ArcScan</a></li>
                <li><a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Faucet</a></li>
              </ul>
            </div>
          </div>
           <div className="border-t border-base-500/10 pt-6 flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full">
              <p className="text-text-muted text-xs">
                MIT License &middot; Chain ID: 5042002
              </p>
              <p className="text-text-muted text-xs">
                Built on <a href="https://www.arc.network/" target="_blank" rel="noopener noreferrer" className="text-plum-400 hover:text-plum-300">Arc Testnet</a>
              </p>
            </div>
            <p className="text-text-muted text-[10px]">
              Arc is a trademark of Circle Internet Group, Inc. and/or its affiliates.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
