import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

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

const CreateWordSchema = z.object({
  wordbookId: z.number().positive('Wordbook ID is required'),
  learnerId: z.number().positive('Learner ID is required'),
  word: z.string().min(1, 'Word is required'),
  phoneticUs: z.string().optional(),
  phoneticUk: z.string().optional(),
  meaningCn: z.string().optional(),
  meaningEn: z.string().optional(),
  examples: jsonStringValidator.optional(), // JSON string
  imageUrl: z.string().optional(),
  source: z.string().optional(),
  masteryLevel: z.number().min(0).max(2).optional().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wordbookId = searchParams.get('wordbookId')
    const learnerId = searchParams.get('learnerId')
    const masteryLevel = searchParams.get('masteryLevel')

    // Require both wordbookId and learnerId
    if (!wordbookId || !learnerId) {
      return NextResponse.json(
        { error: 'wordbookId and learnerId are required' },
        { status: 400 }
      )
    }

    const wordbookIdNum = parseInt(wordbookId)
    const learnerIdNum = parseInt(learnerId)

    if (isNaN(wordbookIdNum) || isNaN(learnerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid wordbookId or learnerId' },
        { status: 400 }
      )
    }

    // Build filter
    const filter: Prisma.WordWhereInput = {
      wordbookId: wordbookIdNum,
      learnerId: learnerIdNum,
    }

    if (masteryLevel !== null) {
      const masteryNum = parseInt(masteryLevel)
      if (!isNaN(masteryNum) && masteryNum >= 0 && masteryNum <= 2) {
        filter.masteryLevel = masteryNum
      }
    }

    const words = await db.word.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        word: true,
        phoneticUs: true,
        phoneticUk: true,
        meaningCn: true,
        meaningEn: true,
        examples: true,
        imageUrl: true,
        source: true,
        masteryLevel: true,
        wordbookId: true,
        learnerId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Parse examples JSON for each word to maintain consistency with [id] endpoint
    const parsedWords = words.map((word) => {
      let parsedExamples = null
      if (word.examples) {
        try {
          parsedExamples = JSON.parse(word.examples)
        } catch (e) {
          console.error('Failed to parse examples JSON:', e)
          parsedExamples = null
        }
      }
      return {
        ...word,
        examples: parsedExamples,
      }
    })

    return NextResponse.json({ words: parsedWords })
  } catch (error) {
    console.error('Failed to fetch words:', error)
    return NextResponse.json(
      { error: 'Failed to fetch words' },
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

    const validation = CreateWordSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const {
      wordbookId,
      learnerId,
      word,
      phoneticUs,
      phoneticUk,
      meaningCn,
      meaningEn,
      examples,
      imageUrl,
      source,
      masteryLevel,
    } = validation.data

    // Verify wordbook and learner exist
    const [wordbook, learner] = await Promise.all([
      db.wordbook.findUnique({ where: { id: wordbookId } }),
      db.learner.findUnique({ where: { id: learnerId } }),
    ])

    if (!wordbook) {
      return NextResponse.json(
        { error: 'Wordbook not found' },
        { status: 404 }
      )
    }

    if (!learner) {
      return NextResponse.json(
        { error: 'Learner not found' },
        { status: 404 }
      )
    }

    const createdWord = await db.word.create({
      data: {
        wordbookId,
        learnerId,
        word,
        phoneticUs,
        phoneticUk,
        meaningCn,
        meaningEn,
        examples,
        imageUrl,
        source,
        masteryLevel,
      },
    })

    return NextResponse.json({ word: createdWord }, { status: 201 })
  } catch (error) {
    console.error('Failed to create word:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to create word' },
      { status: 500 }
    )
  }
}
