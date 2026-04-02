import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { lookupWord, lookupWordFallback } from '@/lib/openai'

const LookupSchema = z.object({
  word: z.string().min(1, 'Word is required'),
})

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = LookupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { word } = validation.data

    try {
      // Try OpenAI first
      const result = await lookupWord(word.toLowerCase().trim())
      return NextResponse.json(result, { status: 200 })
    } catch (openaiError) {
      console.error('OpenAI lookup failed, trying fallback:', openaiError)

      try {
        // Fallback to dictionary API
        const result = await lookupWordFallback(word.toLowerCase().trim())
        return NextResponse.json(result, { status: 200 })
      } catch (fallbackError) {
        console.error('Both lookup methods failed:', fallbackError)
        return NextResponse.json(
          { error: 'Failed to lookup word' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Lookup word error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup word' },
      { status: 500 }
    )
  }
}
