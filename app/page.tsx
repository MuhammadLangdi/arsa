import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import WaitlistForm from "@/components/WaitlistForm";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const params = await searchParams;
  const error = params.error;

  return (
    <main className="min-h-screen bg-[#0A0014] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-700/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[700px] h-[700px] bg-purple-900/20 rounded-full blur-[140px] animate-pulse-slower" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      <SignalLines />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay grain-bg" />

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoOrb />
          <span className="text-lg font-medium tracking-tight">Arsa</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#waitlist" className="text-sm text-white/70 hover:text-white transition hidden sm:inline">
            Request access
          </a>
          <Link href="/api/auth/google" className="text-sm text-white/70 hover:text-white transition">
            Sign in
          </Link>
        </div>
      </nav>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 text-xs tracking-widest uppercase border border-purple-400/20 bg-purple-500/5 rounded-full text-purple-200 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          A new kind of AI. Private beta.
        </div>

        <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.05] mb-8">
          Most AI waits for you to ask.
          <br />
          <span className="bg-gradient-to-r from-purple-300 via-purple-200 to-white bg-clip-text text-transparent italic font-serif">
            Arsa pays attention.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-12">
          Arsa is a quiet AI that watches your life and tells you what matters. It reads your inbox and calendar, sees what you are carrying, and gives you back a clear picture of what is happening, what is coming, and what you are missing.
        </p>

        <div className="flex flex-col items-center gap-4">
          <a href="#waitlist" className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-purple-50 transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            Request access
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">{"\u2192"}</span>
          </a>

          {error && (
            <p className="text-red-300 text-sm">
              {error === "access_denied"
                ? "You denied access. Arsa needs permission to read your inbox and calendar to work."
                : "Something went wrong. Please try again."}
            </p>
          )}

          <p className="text-xs text-white/40 max-w-md mt-2">
            Read-only. Your data is yours. Arsa never sells, shares, or trains on your information.
          </p>
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-32 border-t border-white/5">
        <p className="text-purple-300/70 text-xs tracking-[0.3em] uppercase mb-8 text-center">
          Why Arsa exists
        </p>
        <div className="space-y-7 text-xl md:text-2xl font-light leading-relaxed text-white/80 max-w-3xl mx-auto">
          <p>
            For seventy years, computers have waited for instructions. You type, they answer. You ask, they reply. Even the smartest AI today still works that way.
          </p>
          <p>
            Your life does not work that way. Things happen whether you ask or not. Bills arrive. People wait for you. Decisions stack up. Time passes.
          </p>
          <p className="text-white">
            We are reimagining AI as something that{" "}
            <span className="italic font-serif text-purple-200">pays attention</span>{" "}
            to your life, instead of something you have to remember to use.
          </p>
          <p className="text-white/60">
            Arsa is the first version of that idea.
          </p>
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 border-t border-white/5">
        <p className="text-purple-300/70 text-xs tracking-[0.3em] uppercase mb-6 text-center">
          How it works
        </p>
        <h2 className="text-3xl md:text-4xl font-light tracking-tight text-center mb-16 max-w-3xl mx-auto leading-tight">
          Two senses. One picture.{" "}
          <span className="italic font-serif text-purple-200">Connected by AI.</span>
        </h2>

        <LiveDemo />

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="border border-white/10 rounded-2xl p-7 bg-white/[0.015] hover:bg-white/[0.03] hover:border-purple-400/20 transition group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-400/20 flex items-center justify-center mb-5 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition">
              <span className="text-purple-300 text-lg">01</span>
            </div>
            <h3 className="text-lg font-medium mb-2">It senses</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Arsa reads your Gmail and Google Calendar, filters out the noise, and pays attention to what actually matters in your life.
            </p>
          </div>

          <div className="border border-white/10 rounded-2xl p-7 bg-white/[0.015] hover:bg-white/[0.03] hover:border-purple-400/20 transition group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-400/20 flex items-center justify-center mb-5 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition">
              <span className="text-purple-300 text-lg">02</span>
            </div>
            <h3 className="text-lg font-medium mb-2">It connects</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              An email about a meeting becomes a calendar check. A deadline becomes a question. A friend becomes a name Arsa remembers.
            </p>
          </div>

          <div className="border border-white/10 rounded-2xl p-7 bg-white/[0.015] hover:bg-white/[0.03] hover:border-purple-400/20 transition group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-400/20 flex items-center justify-center mb-5 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition">
              <span className="text-purple-300 text-lg">03</span>
            </div>
            <h3 className="text-lg font-medium mb-2">It tells you</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              No chat box. No prompts. Just a clear picture of what is happening in your life, and what you might be missing.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/40 to-purple-800/40 blur-2xl animate-pulse-slow" />
            <img
              src="/founder.jpg"
              alt="Muhammad, founder of Arsa"
              className="relative w-44 h-44 rounded-2xl object-cover border border-white/10"
            />
          </div>
          <div className="text-center md:text-left">
            <p className="text-purple-300/70 text-xs tracking-[0.3em] uppercase mb-3">
              From the founder
            </p>
            <p className="text-white/85 text-lg leading-relaxed mb-5 italic font-serif">
              {"\u201C"}Most AI was built to answer questions. I wanted to build something that pays attention to your life, so you can stop carrying so much of it in your head.{"\u201D"}
            </p>
            <p className="text-white font-medium">Muhammad</p>
            <p className="text-white/50 text-sm">Founder, Arsa</p>
            <p className="text-white/40 text-sm mt-1">Built in Johannesburg</p>
          </div>
        </div>
      </section>

      <section id="waitlist" className="relative z-10 max-w-3xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-10">
          <p className="text-purple-300/70 text-xs tracking-[0.3em] uppercase mb-4">
            Join the beta
          </p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-5">
            Be one of the first to{" "}
            <span className="italic font-serif text-purple-200">live with Arsa.</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
            Arsa is rolling out slowly to the people who care about being seen clearly. Leave your email and we will reach out personally when your spot opens.
          </p>
        </div>

        <WaitlistForm />
      </section>

      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center border-t border-white/5">
        <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">
          See your life,{" "}
          <span className="italic font-serif text-purple-200">for the first time.</span>
        </h2>
        <a href="#waitlist" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-purple-50 transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]">
          Request access
        </a>
      </section>

      <footer className="relative z-10 max-w-5xl mx-auto px-6 py-10 border-t border-white/5 text-center text-white/30 text-xs">
        Arsa is in private beta. Built in Johannesburg.
      </footer>
    </main>
  );
}

function LogoOrb() {
  return (
    <div className="relative w-8 h-8">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
      <div className="absolute inset-0 rounded-full bg-purple-400/30 animate-orb-pulse" />
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-300/40 to-transparent" />
    </div>
  );
}

function SignalLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" preserveAspectRatio="none" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="signalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168,85,247,0)" />
          <stop offset="50%" stopColor="rgba(168,85,247,0.6)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0)" />
        </linearGradient>
      </defs>
      <path d="M -100,200 Q 300,150 600,250 T 1300,200" stroke="url(#signalGrad)" strokeWidth="1" fill="none" className="signal-flow-1" />
      <path d="M -100,400 Q 400,350 700,450 T 1300,400" stroke="url(#signalGrad)" strokeWidth="1" fill="none" className="signal-flow-2" />
      <path d="M -100,600 Q 350,550 650,650 T 1300,600" stroke="url(#signalGrad)" strokeWidth="1" fill="none" className="signal-flow-3" />
    </svg>
  );
}

function LiveDemo() {
  return (
    <div className="relative max-w-3xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm p-8 md:p-12 overflow-hidden">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-500/15 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 demo-card-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-purple-300/70">Email</span>
          </div>
          <p className="text-white/60 text-xs mb-1">From: Sarah</p>
          <p className="text-white text-sm font-medium leading-snug">
            Can we push the proposal review to Thursday?
          </p>
        </div>

        <div className="hidden md:flex items-center justify-center relative h-20">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-purple-500/0 via-purple-400/60 to-purple-500/0" />
          <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_15px_rgba(216,180,254,0.8)] connector-dot" />
          <div className="relative bg-[#0A0014] border border-purple-400/30 rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-purple-200">
            Arsa
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 demo-card-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-purple-300/70">Calendar</span>
          </div>
          <p className="text-white/60 text-xs mb-1">Thursday, 2:00 PM</p>
          <p className="text-white text-sm font-medium leading-snug">
            Already booked. Dentist appointment.
          </p>
        </div>
      </div>

      <div className="relative mt-8 pt-6 border-t border-white/10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-purple-300/70 mb-2">
          Arsa sees
        </p>
        <p className="text-white/90 italic font-serif text-base md:text-lg leading-relaxed">
          Sarah wants Thursday but you have the dentist booked. Suggest Friday morning.
        </p>
      </div>
    </div>
  );
}