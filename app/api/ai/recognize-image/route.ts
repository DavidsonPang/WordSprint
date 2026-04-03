import { NextRequest, NextResponse } from 'next/server'
import { recognizeWordsFromImage } from '@/lib/openai'
import { z } from 'zod'

const RecognizeImageSchema = z.object({
  image: z.string().min(1, 'Image is required'), // Base64 encoded image
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = RecognizeImageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { image } = validation.data

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '')

    const words = await recognizeWordsFromImage(base64Image)

    return NextResponse.json({ words })
  } catch (error) {
    console.error('Failed to recognize image:', error)
    return NextResponse.json(
      { error: 'Failed to recognize words from image' },
      { status: 500 }
    )
  }
}
