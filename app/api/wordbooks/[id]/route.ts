import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const UpdateWordbookSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
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

    // Check if it's a builtin wordbook
    const existing = await db.wordbook.findUnique({
      where: { id: wordbookId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 })
    }

    if (existing.isBuiltin) {
      return NextResponse.json(
        { error: 'Cannot modify builtin wordbooks' },
        { status: 403 }
      )
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

    const wordbook = await db.wordbook.update({
      where: { id: wordbookId },
      data: validation.data,
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

    // Check if it's a builtin wordbook
    const existing = await db.wordbook.findUnique({
      where: { id: wordbookId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 })
    }

    if (existing.isBuiltin) {
      return NextResponse.json(
        { error: 'Cannot delete builtin wordbooks' },
        { status: 403 }
      )
    }

    await db.wordbook.delete({
      where: { id: wordbookId },
    })

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
