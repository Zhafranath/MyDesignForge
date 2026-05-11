import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://stickerforge.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'StickerForge — AI Redbubble Prompt Generator',
  description:
    'Generate prompt AI siap pakai untuk desain Redbubble: sticker, phone case, dan desain baju. Pilih produk, masukkan ide, lalu dapatkan konsep original + 9 prompt variatif.',
  keywords: [
    'redbubble prompt', 'redbubble sticker', 'phone case design',
    'desain baju ai', 'prompt midjourney', 'prompt ai stiker',
    'kawaii sticker', 'chibi mascot', 'print on demand design',
  ],
  authors: [{ name: 'StickerForge' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'StickerForge — AI Redbubble Prompt Generator',
    description: 'Generate prompt AI untuk sticker, phone case, dan desain baju Redbubble.',
    url: baseUrl,
    siteName: 'StickerForge',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'StickerForge — AI Redbubble Prompt Generator',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StickerForge — AI Redbubble Prompt Generator',
    description: 'Generate prompt AI untuk sticker, phone case, dan desain baju Redbubble.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-body antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#2D2640',
              borderRadius: '20px',
              border: '2px solid #E8E0FF',
              fontFamily: 'var(--font-nunito)',
              fontWeight: '600',
              boxShadow: '0 4px 20px rgba(201, 184, 255, 0.25)',
            },
            success: {
              iconTheme: { primary: '#B8FFE4', secondary: '#2D2640' },
            },
          }}
        />
      </body>
    </html>
  );
}
