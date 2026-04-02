import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateLearnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().optional(),
})

export async function GET() {
  try {
    const learners = await db.learner.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ learners })
  } catch (error) {
    console.error('Failed to fetch learners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learners' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    const validation = CreateLearnerSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const { name, avatar } = validation.data

    const learner = await db.learner.create({
      data: { name, avatar },
    })

    return NextResponse.json({ learner }, { status: 201 })
  } catch (error) {
    console.error('Failed to create learner:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to create learner' },
      { status: 500 }
    )
  }
}
