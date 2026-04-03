import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/openai'
import { z } from 'zod'

const SpeechToTextSchema = z.object({
  audio: z.any(), // FormData file validation handled separately
})

const ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
]
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    // Zod validation for consistency with other routes
    const validation = SpeechToTextSchema.safeParse({ audio: audioFile })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // File type validation
    if (!ALLOWED_MIME_TYPES.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: WAV, MP3, MP4, WebM' },
        { status: 400 }
      )
    }

    // File size validation
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      )
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    const text = await transcribeAudio(audioBuffer)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Failed to transcribe audio:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
