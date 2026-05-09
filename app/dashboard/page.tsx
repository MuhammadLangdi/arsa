import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import ScanButton from "@/components/ScanButton";

type Signal = {
  category: string;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
  people?: string[];
};

const urgencyColor = {
  high: "bg-red-500/10 text-red-300 border-red-500/30",
  medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  low: "bg-white/5 text-white/60 border-white/10",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("name, email, picture")
    .eq("id", session.userId)
    .single();

  if (!user) redirect("/");

  const { data: latestSnapshot } = await supabaseAdmin
    .from("life_snapshots")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const signals: Signal[] = latestSnapshot?.signals || [];

  return (
    <main className="min-h-screen bg-[#0A0014] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] bg-purple-700/15 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px] animate-pulse-slower" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        <header className="flex items-center justify-between py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
            <span className="text-lg font-medium tracking-tight">Arsa</span>
          </div>
          <div className="flex items-center gap-4">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name || "User"}
                className="w-9 h-9 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
            )}
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-white/60 hover:text-white transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="py-16 space-y-8">
          <div className="space-y-3">
            <p className="text-purple-300/70 text-xs tracking-[0.3em] uppercase">
              {latestSnapshot ? "Your life, right now" : "Welcome"}
            </p>
            <h1 className="text-3xl md:text-5xl font-light leading-tight">
              {latestSnapshot ? (
                <span className="italic font-serif text-white">
                  {latestSnapshot.summary}
                </span>
              ) : (
                <>
                  Hello,{" "}
                  <span className="italic font-serif text-purple-200">
                    {user.name?.split(" ")[0] || "friend"}.
                  </span>
                </>
              )}
            </h1>

            {!latestSnapshot && (
              <p className="text-white/60 max-w-xl leading-relaxed pt-2">
                Arsa is connected to your inbox and calendar. Run your first
                scan and Arsa will read the last 30 days of your life to build
                the first picture of what is happening.
              </p>
            )}

            {latestSnapshot?.whats_new && (
              <div className="mt-6 border-l-2 border-purple-400/40 pl-5 max-w-2xl bg-purple-500/[0.04] py-3 rounded-r-lg">
                <p className="text-purple-300/70 text-xs tracking-[0.3em] uppercase mb-1">
                  Since last scan
                </p>
                <p className="text-white/80 leading-relaxed">
                  {latestSnapshot.whats_new}
                </p>
              </div>
            )}
          </div>

          <ScanButton hasSnapshot={!!latestSnapshot} />
        </section>

        {signals.length > 0 && (
          <section className="pb-24 space-y-4">
            <h2 className="text-xl font-light text-white/80 mb-6">Signals</h2>
            <div className="grid gap-3">
              {signals.map((signal, i) => (
                <div
                  key={i}
                  className="border border-white/10 rounded-2xl p-5 hover:border-purple-400/30 transition bg-white/[0.02] hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-purple-300/70 tracking-[0.2em] uppercase">
                        {signal.category}
                      </span>
                      <span
                        className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                          urgencyColor[signal.urgency]
                        }`}
                      >
                        {signal.urgency}
                      </span>
                      {signal.people && signal.people.length > 0 && (
                        <span className="text-[10px] tracking-wider uppercase text-white/40">
                          {signal.people.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-1">{signal.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>

            {latestSnapshot && (
              <p className="text-white/30 text-xs pt-6">
                Last scanned{" "}
                {new Date(latestSnapshot.created_at).toLocaleString()}.{" "}
                {latestSnapshot.email_count} emails analyzed.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
