import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FindOrigin Bot',
  description: 'Telegram bot for finding information sources',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
})
{
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
