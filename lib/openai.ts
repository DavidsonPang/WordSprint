import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. AI features will be disabled.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

export async function lookupWord(word: string) {
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
    console.error('OpenAI lookup failed:', error)
    throw new Error('Failed to lookup word')
  }
}

// Fallback to free dictionary API
export async function lookupWordFallback(word: string) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    )

    if (!response.ok) {
      throw new Error('Dictionary API failed')
    }

    const data = await response.json()
    const entry = data[0]

    return {
      word,
      phoneticUs: entry.phonetics[0]?.text || '',
      phoneticUk: entry.phonetics[1]?.text || '',
      meaningCn: '',
      meaningEn: entry.meanings[0]?.definitions[0]?.definition || '',
      examples: [
        {
          en: entry.meanings[0]?.definitions[0]?.example || '',
          cn: '',
        },
      ],
      imageUrl: null,
    }
  } catch (error) {
    console.error('Fallback lookup failed:', error)
    throw new Error('Failed to lookup word')
  }
}
