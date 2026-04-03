import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
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
