import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-medium text-zinc-900">
        No pudimos confirmar tu correo
      </h1>
      <p className="mt-3 max-w-md text-zinc-600">
        El enlace pudo haber vencido o ya fue utilizado. Vuelve al registro e
        inténtalo de nuevo.
      </p>
      <Link
        href="/#registro"
        className="mt-6 rounded-full bg-black px-6 py-3 text-sm text-white transition-colors hover:bg-zinc-900"
      >
        Volver al registro
      </Link>
    </main>
  );
}
