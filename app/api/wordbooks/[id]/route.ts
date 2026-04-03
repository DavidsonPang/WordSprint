import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const UpdateWordbookSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  category: z.string().min(1, 'Category cannot be empty').optional(),
  description: z.string().min(1, 'Description cannot be empty').optional(),
}).refine(data => Object.values(data).some(v => v !== undefined), {
  message: 'At least one field must be provided for update',
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const wordbookId = parseInt(id)

    if (isNaN(wordbookId)) {
      return NextResponse.json({ error: 'Invalid wordbook ID' }, { status: 400 })
    }

    const wordbook = await db.wordbook.findUnique({
      where: { id: wordbookId },
      include: {
        _count: {
          select: { words: true },
        },
      },
    })

    if (!wordbook) {
      return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 })
    }

    return NextResponse.json({
      wordbook: {
        ...wordbook,
        wordCount: wordbook._count.words,
        _count: undefined,
      },
    })
  } catch (error) {
    console.error('Failed to fetch wordbook:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wordbook' },
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
    const wordbookId = parseInt(id)

    if (isNaN(wordbookId)) {
      return NextResponse.json({ error: 'Invalid wordbook ID' }, { status: 400 })
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

    const validation = UpdateWordbookSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    // Atomically update only non-builtin wordbooks
    const result = await db.wordbook.updateMany({
      where: { id: wordbookId, isBuiltin: false },
      data: validation.data,
    })

    if (result.count === 0) {
      // Check why: builtin or not found
      const wordbook = await db.wordbook.findUnique({
        where: { id: wordbookId },
      })
      if (!wordbook) {
        return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 })
      }
      if (wordbook.isBuiltin) {
        return NextResponse.json(
          { error: 'Cannot modify builtin wordbooks' },
          { status: 403 }
        )
      }
    }

    const wordbook = await db.wordbook.findUnique({
      where: { id: wordbookId },
    })

    return NextResponse.json({ wordbook })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Wordbook not found' },
        { status: 404 }
      )
    }
    console.error('Failed to update wordbook:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to update wordbook' },
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
    const wordbookId = parseInt(id)

    if (isNaN(wordbookId)) {
      return NextResponse.json({ error: 'Invalid wordbook ID' }, { status: 400 })
    }

    // Atomically delete only non-builtin wordbooks
    const result = await db.wordbook.deleteMany({
      where: { id: wordbookId, isBuiltin: false },
    })

    if (result.count === 0) {
      // Check why: builtin or not found
      const wordbook = await db.wordbook.findUnique({
        where: { id: wordbookId },
      })
      if (!wordbook) {
        return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 })
      }
      if (wordbook.isBuiltin) {
        return NextResponse.json(
          { error: 'Cannot delete builtin wordbooks' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Wordbook not found' },
        { status: 404 }
      )
    }
    console.error('Failed to delete wordbook:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to delete wordbook' },
      { status: 500 }
    )
  }
}
