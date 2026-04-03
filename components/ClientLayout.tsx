'use client'

import { ReactNode } from 'react'
import { AppProvider, useApp } from './AppProvider'
import Header from './layout/Header'
import TabNavigation from './layout/TabNavigation'
import BottomTabNavigation from './layout/BottomTabNavigation'

function ClientLayoutContent({ children }: { children: ReactNode }) {
  const {
    selectedLearnerId,
    setSelectedLearnerId,
    selectedWordbookId,
    setSelectedWordbookId,
  } = useApp()

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        selectedLearnerId={selectedLearnerId}
        onLearnerChange={setSelectedLearnerId}
        selectedWordbookId={selectedWordbookId}
        onWordbookChange={setSelectedWordbookId}
      />
      <TabNavigation />
      <main className="flex-1 bg-gray-50 pb-20 md:pb-0">{children}</main>
      <BottomTabNavigation />
    </div>
  )
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </AppProvider>
  )
}
