import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 dark:bg-slate-950">
      <h1 className="text-6xl font-bold text-slate-900 dark:text-white">404</h1>
      <p className="text-center text-slate-600 dark:text-slate-400">
        Página não encontrada.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
