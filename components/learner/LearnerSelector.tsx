'use client'

import { useState, useEffect, useCallback } from 'react'

interface Learner {
  id: number
  name: string
  avatar?: string | null
}

interface LearnerSelectorProps {
  selectedLearnerId: number | null
  onLearnerChange: (learnerId: number | null) => void
}

export default function LearnerSelector({ selectedLearnerId, onLearnerChange }: LearnerSelectorProps) {
  const [learners, setLearners] = useState<Learner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLearners = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/learners')
      if (!response.ok) {
        throw new Error('Failed to fetch learners')
      }
      const data = await response.json()
      setLearners(data.learners || [])

      // Auto-select first learner if none selected
      if (!selectedLearnerId && data.learners.length > 0) {
        onLearnerChange(data.learners[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learners')
    } finally {
      setIsLoading(false)
    }
  }, [selectedLearnerId, onLearnerChange])

  useEffect(() => {
    fetchLearners()
  }, [fetchLearners])

  const handleAddNewLearner = async () => {
    const name = prompt('Enter learner name:')
    if (!name) return

    try {
      const response = await fetch('/api/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Failed to create learner')
      }

      const data = await response.json()
      setLearners([data.learner, ...learners])
      onLearnerChange(data.learner.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create learner')
    }
  }

  if (isLoading) {
    return (
      <div className="text-white text-sm">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-200 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-sm">User:</span>
      <select
        value={selectedLearnerId || ''}
        onChange={(e) => onLearnerChange(e.target.value ? parseInt(e.target.value) : null)}
        className="bg-white/20 text-white rounded px-3 py-1 text-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <option value="">Select User</option>
        {learners.map((learner) => (
          <option key={learner.id} value={learner.id}>
            {learner.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAddNewLearner}
        className="bg-white/20 hover:bg-white/30 text-white rounded px-3 py-1 text-sm border border-white/30 transition-colors"
      >
        + Add New
      </button>
    </div>
  )
}
