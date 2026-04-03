'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: '词库', path: '/wordbooks', icon: '📚' },
  { name: '添加', path: '/add', icon: '➕' },
  { name: '学习', path: '/learn', icon: '📖' },
  { name: '统计', path: '/stats', icon: '📊' },
]

export default function TabNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/wordbooks') {
      return pathname === '/' || pathname === '/wordbooks'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="hidden md:block bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const active = isActive(tab.path)
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  active
                    ? 'text-[#4CAF50] border-[#4CAF50]'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
