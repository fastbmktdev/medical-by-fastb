import { useTranslations } from 'next-intl';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">
        Welcome to THAIKICK MUAYTHAI
      </h1>
      <p className="text-zinc-400">
        This is a placeholder homepage for the locale-based routing.
        The existing homepage should be moved here.
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        Current locale: <span className="font-mono font-bold text-red-400">{locale}</span>
      </p>
    </div>
  );
}
