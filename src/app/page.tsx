// app/[lang]/page.tsx
import { isValidLang, defaultLang, Lang } from '../../lib/i18n';
import { Metadata } from 'next';

interface Props {
  params: { lang: string };
}

const translations: Record<Lang, { title: string; description: string }> = {
  en: { title: 'Welcome', description: 'This is the English page.' },
  fr: { title: 'Bienvenue', description: 'Ceci est la page en français.' },
  es: { title: 'Bienvenido', description: 'Esta es la página en español.' },
};

// ✅ Dynamic metadata per language
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang: Lang = isValidLang(params.lang) ? params.lang : defaultLang;
  const t = translations[lang];

  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: '/en',
        fr: '/fr',
        es: '/es',
      },
    },
  };
}

export default async function Page({ params }: Props) {
  const lang: Lang = isValidLang(params.lang) ? params.lang : defaultLang;
  const t = translations[lang];

  return (
    <main>
      <h1>{t.title}</h1>
      <p>{t.description}</p>
    </main>
  );
}
