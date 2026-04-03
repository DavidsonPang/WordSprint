'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AppContextType {
  selectedLearnerId: number | null
  setSelectedLearnerId: (id: number | null) => void
  selectedWordbookId: number | null
  setSelectedWordbookId: (id: number | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedLearnerId, setSelectedLearnerId] = useState<number | null>(null)
  const [selectedWordbookId, setSelectedWordbookId] = useState<number | null>(null)

  return (
    <AppContext.Provider
      value={{
        selectedLearnerId,
        setSelectedLearnerId,
        selectedWordbookId,
        setSelectedWordbookId,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
