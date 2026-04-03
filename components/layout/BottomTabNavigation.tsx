'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: '词库', path: '/wordbooks', icon: '📚' },
  { name: '添加', path: '/add', icon: '➕' },
  { name: '学习', path: '/learn', icon: '📖' },
  { name: '统计', path: '/stats', icon: '📊' },
]

export default function BottomTabNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/wordbooks') {
      return pathname === '/' || pathname === '/wordbooks'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center gap-1 px-4 py-3 min-w-0 flex-1 transition-colors ${
                active ? 'text-[#4CAF50]' : 'text-gray-600'
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-xs font-medium truncate w-full text-center">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
