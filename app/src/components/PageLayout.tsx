import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <header className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
        </Link>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <section className="rounded-2xl bg-white/10 backdrop-blur-sm p-6">
        {children}
      </section>
    </main>
  );
}
