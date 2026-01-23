import './globals.css'

export const metadata = {
  title: 'Budsjett App',
  description: 'A simple budgeting application',
} 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-600 text-white text-shadow-amber">{children}</body>
    </html>
  )
}