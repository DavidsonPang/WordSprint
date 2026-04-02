import { NextRequest, NextResponse } from 'next/server'
import { lookupWord, lookupWordFallback } from '@/lib/openai'
import { z } from 'zod'

const LookupSchema = z.object({
  word: z.string().min(1, 'Word is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = LookupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { word } = validation.data

    let result
    try {
      // Try OpenAI first
      result = await lookupWord(word.toLowerCase().trim())
    } catch (error) {
      console.log('OpenAI failed, trying fallback dictionary...')
      // Fallback to free dictionary API
      result = await lookupWordFallback(word.toLowerCase().trim())
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to lookup word:', error)
    return NextResponse.json(
      { error: 'Failed to lookup word' },
      { status: 500 }
    )
  }
}
