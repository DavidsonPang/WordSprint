import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { WordExample } from '@/types'

// Helper to validate JSON string
const jsonStringValidator = z.string().refine(
  (val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  },
  { message: 'examples must be a valid JSON string' }
)

const UpdateWordSchema = z.object({
  word: z.string().min(1).optional(),
  phoneticUs: z.string().optional(),
  phoneticUk: z.string().optional(),
  meaningCn: z.string().optional(),
  meaningEn: z.string().optional(),
  examples: jsonStringValidator.optional(), // JSON string
  imageUrl: z.string().optional(),
  source: z.string().optional(),
  masteryLevel: z.number().min(0).max(2).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const wordId = parseInt(id)

    if (isNaN(wordId)) {
      return NextResponse.json({ error: 'Invalid word ID' }, { status: 400 })
    }

    const word = await db.word.findUnique({
      where: { id: wordId },
    })

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }

    // Parse examples JSON if present
    let parsedExamples: WordExample[] | null = null
    if (word.examples) {
      try {
        parsedExamples = JSON.parse(word.examples)
      } catch (e) {
        console.error('Failed to parse examples JSON:', e)
        parsedExamples = null
      }
    }

    return NextResponse.json({
      word: {
        ...word,
        examples: parsedExamples,
      },
    })
  } catch (error) {
    console.error('Failed to fetch word:', error)
    return NextResponse.json(
      { error: 'Failed to fetch word' },
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
    const wordId = parseInt(id)

    if (isNaN(wordId)) {
      return NextResponse.json({ error: 'Invalid word ID' }, { status: 400 })
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

    const validation = UpdateWordSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const updatedWord = await db.word.update({
      where: { id: wordId },
      data: validation.data,
    })

    // Parse examples JSON if present
    let parsedExamples: WordExample[] | null = null
    if (updatedWord.examples) {
      try {
        parsedExamples = JSON.parse(updatedWord.examples)
      } catch (e) {
        console.error('Failed to parse examples JSON:', e)
        parsedExamples = null
      }
    }

    return NextResponse.json({
      word: {
        ...updatedWord,
        examples: parsedExamples,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }
    console.error('Failed to update word:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to update word' },
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
    const wordId = parseInt(id)

    if (isNaN(wordId)) {
      return NextResponse.json({ error: 'Invalid word ID' }, { status: 400 })
    }

    await db.word.delete({
      where: { id: wordId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }
    console.error('Failed to delete word:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    )
  }
}
