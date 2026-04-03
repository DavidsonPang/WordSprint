import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const learnerId = searchParams.get('learnerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Parse date range if provided
    let startDateTime: Date | undefined
    let endDateTime: Date | undefined

    if (startDate) {
      startDateTime = new Date(startDate)
      if (isNaN(startDateTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate' },
          { status: 400 }
        )
      }
    }

    if (endDate) {
      endDateTime = new Date(endDate)
      if (isNaN(endDateTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate' },
          { status: 400 }
        )
      }
    }

    // Build where clause for date filtering
    const where: any = {
      learnerId: learnerIdNum,
    }

    if (startDateTime || endDateTime) {
      where.timestamp = {}
      if (startDateTime) {
        where.timestamp.gte = startDateTime
      }
      if (endDateTime) {
        where.timestamp.lte = endDateTime
      }
    }

    // Get all records for the learner (with optional date filter)
    const records = await db.learningRecord.findMany({
      where,
      select: {
        id: true,
        learnerId: true,
        wordId: true,
        studyType: true,
        testType: true,
        isCorrect: true,
        timestamp: true,
      },
    })

    // Calculate statistics
    const totalSessions = records.length

    // Count unique words
    const uniqueWordIds = new Set(records.map(r => r.wordId))
    const totalWords = uniqueWordIds.size

    // Calculate test accuracy
    const testRecords = records.filter(r => r.studyType === 'test')
    const correctTests = testRecords.filter(r => r.isCorrect === true).length
    const totalTests = testRecords.length
    const testAccuracy = {
      correct: correctTests,
      total: totalTests,
      percentage: totalTests > 0 ? Math.round((correctTests / totalTests) * 100) : 0,
    }

    // Calculate recent activity (last 7 days)
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const recentRecords = records.filter(r => new Date(r.timestamp) >= sevenDaysAgo)
    const recentActivity = {
      last7Days: recentRecords.length,
    }

    const stats = {
      totalSessions,
      totalWords,
      testAccuracy,
      recentActivity,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to fetch learning stats:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to fetch learning stats' },
      { status: 500 }
    )
  }
}
