import { createContext, useContext, useState, ReactNode } from 'react'

export type DrawerTab = 'market' | 'intel' | 'ai' | 'watchlist' | 'scheduler' | 'settings'

interface DrawerCtx {
  open: boolean
  tab: DrawerTab
  openDrawer: (tab?: DrawerTab) => void
  closeDrawer: () => void
}

const DrawerContext = createContext<DrawerCtx>({
  open: false,
  tab: 'market',
  openDrawer: () => {},
  closeDrawer: () => {},
})

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<DrawerTab>('market')

  const openDrawer = (t: DrawerTab = 'market') => {
    setTab(t)
    setOpen(true)
  }
  const closeDrawer = () => setOpen(false)

  return (
    <DrawerContext.Provider value={{ open, tab, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  )
}

export const useDrawer = () => useContext(DrawerContext)
