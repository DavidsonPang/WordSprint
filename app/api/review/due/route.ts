import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const learnerId = searchParams.get('learnerId')
    const wordbookId = searchParams.get('wordbookId')

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

    let wordbookIdNum: number | undefined
    if (wordbookId) {
      wordbookIdNum = parseInt(wordbookId)
      if (isNaN(wordbookIdNum)) {
        return NextResponse.json(
          { error: 'Invalid wordbookId' },
          { status: 400 }
        )
      }
    }

    const now = new Date()

    // 查询今天需要复习的单词
    const schedules = await db.reviewSchedule.findMany({
      where: {
        learnerId: learnerIdNum,
        nextReviewDate: {
          lte: now,
        },
        ...(wordbookIdNum && {
          word: {
            wordbookId: wordbookIdNum,
          },
        }),
      },
      include: {
        word: {
          include: {
            wordbook: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        nextReviewDate: 'asc',
      },
    })

    const words = schedules.map((s) => ({
      ...s.word,
      nextReviewDate: s.nextReviewDate,
      reviewCount: s.reviewCount,
    }))

    return NextResponse.json({ words })
  } catch (error) {
    console.error('Failed to fetch due words:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to fetch due words' },
      { status: 500 }
    )
  }
}
