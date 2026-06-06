import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'
import { CommandPalette, useCommandPalette } from './CommandPalette'

export default function Layout({ children }) {
  const { open, setOpen } = useCommandPalette()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar onOpenPalette={() => setOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
          {children}
        </main>
      </div>
      <MobileNav />
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
