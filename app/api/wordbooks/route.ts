import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateWordbookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['preset', 'custom']),
  category: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const learnerId = searchParams.get('learnerId')

    const wordbooks = await db.wordbook.findMany({
      orderBy: [
        { isBuiltin: 'desc' }, // Preset wordbooks first
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        description: true,
        isBuiltin: true,
        _count: {
          select: {
            words: learnerId
              ? { where: { learnerId: parseInt(learnerId) } }
              : true,
          },
        },
      },
    })

    // Transform to include word counts
    const wordbooksWithCounts = wordbooks.map((wb) => ({
      ...wb,
      wordCount: wb._count.words,
      _count: undefined,
    }))

    return NextResponse.json({ wordbooks: wordbooksWithCounts })
  } catch (error) {
    console.error('Failed to fetch wordbooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wordbooks' },
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

    const validation = CreateWordbookSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const { name, type, category, description } = validation.data

    const wordbook = await db.wordbook.create({
      data: {
        name,
        type,
        category,
        description,
        isBuiltin: false,
      },
    })

    return NextResponse.json({ wordbook }, { status: 201 })
  } catch (error) {
    console.error('Failed to create wordbook:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to create wordbook' },
      { status: 500 }
    )
  }
}
