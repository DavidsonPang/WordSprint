import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const UpdateLearnerSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().optional(),
}).refine(data => Object.values(data).some(v => v !== undefined), {
  message: 'At least one field must be provided for update',
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const learnerId = parseInt(id)

    if (isNaN(learnerId)) {
      return NextResponse.json({ error: 'Invalid learner ID' }, { status: 400 })
    }

    const learner = await db.learner.findUnique({
      where: { id: learnerId },
      select: {
        id: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    return NextResponse.json({ learner })
  } catch (error) {
    console.error('Failed to fetch learner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learner' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const learnerId = parseInt(id)

    if (isNaN(learnerId)) {
      return NextResponse.json({ error: 'Invalid learner ID' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    const validation = UpdateLearnerSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const learner = await db.learner.update({
      where: { id: learnerId },
      data: validation.data,
    })

    return NextResponse.json({ learner })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Learner not found' },
        { status: 404 }
      )
    }
    console.error('Failed to update learner:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to update learner' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const learnerId = parseInt(id)

    if (isNaN(learnerId)) {
      return NextResponse.json({ error: 'Invalid learner ID' }, { status: 400 })
    }

    const learner = await db.learner.delete({
      where: { id: learnerId },
    })

    return NextResponse.json({ learner })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Learner not found' },
        { status: 404 }
      )
    }
    console.error('Failed to delete learner:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to delete learner' },
      { status: 500 }
    )
  }
}
