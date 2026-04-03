'use client'

import { useState, useEffect, useCallback } from 'react'
import LearnerSelector from '@/components/learner/LearnerSelector'

interface Wordbook {
  id: number
  name: string
  type: string
}

interface HeaderProps {
  selectedLearnerId: number | null
  onLearnerChange: (learnerId: number | null) => void
  selectedWordbookId: number | null
  onWordbookChange: (wordbookId: number | null) => void
}

export default function Header({
  selectedLearnerId,
  onLearnerChange,
  selectedWordbookId,
  onWordbookChange,
}: HeaderProps) {
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchWordbooks = useCallback(async () => {
    try {
      setIsLoading(true)
      const url = selectedLearnerId
        ? `/api/wordbooks?learnerId=${selectedLearnerId}`
        : '/api/wordbooks'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch wordbooks')
      const data = await response.json()
      setWordbooks(data.wordbooks || [])

      // Auto-select first wordbook if none selected
      if (!selectedWordbookId && data.wordbooks.length > 0) {
        onWordbookChange(data.wordbooks[0].id)
      }
    } catch (err) {
      console.error('Failed to load wordbooks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedLearnerId, selectedWordbookId, onWordbookChange])

  useEffect(() => {
    fetchWordbooks()
  }, [fetchWordbooks])

  return (
    <header className="bg-[#4CAF50] text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo/Branding */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">WordSprint</span>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-6 flex-wrap">
            <LearnerSelector
              selectedLearnerId={selectedLearnerId}
              onLearnerChange={onLearnerChange}
            />

            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Wordbook:</span>
              <select
                value={selectedWordbookId || ''}
                onChange={(e) => onWordbookChange(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!selectedLearnerId || isLoading}
                className="bg-white/20 text-white rounded px-3 py-1 text-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedLearnerId ? 'Select user first' : isLoading ? 'Loading...' : 'Select Wordbook'}
                </option>
                {wordbooks.map((wordbook) => (
                  <option key={wordbook.id} value={wordbook.id}>
                    {wordbook.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
