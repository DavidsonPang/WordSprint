import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. AI features will be disabled.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

interface WordLookupResult {
  word: string
  phoneticUs?: string
  phoneticUk?: string
  meaningCn?: string
  meaningEn?: string
  examples?: Array<{ en: string; cn: string }>
  imageUrl?: string | null
}

export async function lookupWord(word: string): Promise<WordLookupResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful English-Chinese dictionary. Return word information in JSON format.',
        },
        {
          role: 'user',
          content: `Please provide information for the English word "${word}" in the following JSON format:
{
  "word": "${word}",
  "phoneticUs": "US pronunciation in IPA",
  "phoneticUk": "UK pronunciation in IPA",
  "meaningCn": "Chinese meaning",
  "meaningEn": "English definition",
  "examples": [{"en": "English example sentence", "cn": "Chinese translation"}],
  "imageUrl": null
}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('OpenAI lookup failed:', errorMessage)
    throw new Error(`Failed to lookup word "${word}": ${errorMessage}`)
  }
}

export async function recognizeWordsFromImage(imageBase64: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please identify all English words in this image and return them as a JSON array. Format: ["word1", "word2", "word3"]',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"words":[]}')
    return result.words || []
  } catch (error) {
    console.error('Image recognition failed:', error)
    throw new Error('Failed to recognize words from image')
  }
}

// Fallback to free dictionary API
export async function lookupWordFallback(word: string): Promise<WordLookupResult> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    )

    if (!response.ok) {
      throw new Error(`Dictionary API returned status ${response.status}`)
    }

    const data = await response.json()
    const entry = data[0]

    if (!entry) {
      throw new Error('No dictionary entry found for word')
    }

    // Defensive checks for array access
    const phoneticUs = entry.phonetics && entry.phonetics[0] ? entry.phonetics[0].text : ''
    const phoneticUk = entry.phonetics && entry.phonetics[1] ? entry.phonetics[1].text : ''
    const meaningEn = entry.meanings && entry.meanings[0] && entry.meanings[0].definitions && entry.meanings[0].definitions[0] ? entry.meanings[0].definitions[0].definition : ''
    const example = entry.meanings && entry.meanings[0] && entry.meanings[0].definitions && entry.meanings[0].definitions[0] ? entry.meanings[0].definitions[0].example : ''

    return {
      word,
      phoneticUs,
      phoneticUk,
      meaningCn: '',
      meaningEn,
      examples: example ? [{ en: example, cn: '' }] : [],
      imageUrl: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Fallback lookup failed:', errorMessage)
    throw new Error(`Failed to lookup word "${word}" using fallback API: ${errorMessage}`)
  }
}
