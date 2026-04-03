import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateReviewSchedule } from '@/lib/review-schedule'
import { z } from 'zod'

const UpdateScheduleSchema = z.object({
  learnerId: z.number(),
  wordId: z.number(),
  masteryLevel: z.number().min(0).max(2),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = UpdateScheduleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { learnerId, wordId, masteryLevel } = validation.data

    const nextReviewDate = await updateReviewSchedule(
      db,
      learnerId,
      wordId,
      masteryLevel
    )

    return NextResponse.json({ nextReviewDate })
  } catch (error) {
    console.error('Failed to update review schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update review schedule' },
      { status: 500 }
    )
  }
}
