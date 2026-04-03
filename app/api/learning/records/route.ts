import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const CreateRecordSchema = z.object({
  learnerId: z.number().int().positive('learnerId must be a positive integer'),
  wordId: z.number().int().positive('wordId must be a positive integer'),
  studyType: z.enum(['card', 'test'], { errorMap: () => ({ message: 'studyType must be card or test' }) }),
  testType: z.enum(['word2meaning', 'meaning2word', 'listen', 'spell'], {
    errorMap: () => ({ message: 'testType must be word2meaning, meaning2word, listen, or spell' })
  }).optional(),
  isCorrect: z.boolean().optional(),
}).refine(
  (data) => data.studyType !== 'test' || data.testType !== undefined,
  {
    message: 'testType is required when studyType is "test"',
    path: ['testType'],
  }
)

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

    const validation = CreateRecordSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const { learnerId, wordId, studyType, testType, isCorrect } = validation.data

    // Validate foreign keys
    const learner = await db.learner.findUnique({ where: { id: learnerId } })
    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    const word = await db.word.findUnique({ where: { id: wordId } })
    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }

    const record = await db.learningRecord.create({
      data: {
        learnerId,
        wordId,
        studyType,
        testType: testType || null,
        isCorrect: isCorrect !== undefined ? isCorrect : null,
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('Failed to create learning record:', error, error instanceof Error ? error.message : '')
    return NextResponse.json(
      { error: 'Failed to create learning record' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const learnerId = searchParams.get('learnerId')
    const wordId = searchParams.get('wordId')
    const studyType = searchParams.get('studyType')

    if (!learnerId) {
      return NextResponse.json(
        { error: 'learnerId is required' },
        { status: 400 }
      )
    }

    const learnerIdNum = parseInt(learnerId)
    if (isNaN(learnerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid learnerId' },
        { status: 400 }
      )
    }

    let wordIdNum: number | undefined
    if (wordId) {
      wordIdNum = parseInt(wordId)
      if (isNaN(wordIdNum)) {
        return NextResponse.json(
          { error: 'Invalid wordId' },
          { status: 400 }
        )
      }
    }

    // Build where clause
    const where: Prisma.LearningRecordWhereInput = {
      learnerId: learnerIdNum,
    }

    if (wordIdNum) {
      where.wordId = wordIdNum
    }

    if (studyType) {
      where.studyType = studyType
    }

    const records = await db.learningRecord.findMany({
      where,
      include: {
        word: {
          select: {
            id: true,
            word: true,
            meaningCn: true,
            masteryLevel: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Failed to fetch learning records:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to fetch learning records' },
      { status: 500 }
    )
  }
}
