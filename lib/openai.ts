import OpenAI from 'openai'

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set. AI word lookup will fallback to dictionary API.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

/**
 * Lookup a word using GPT-4 and return structured information
 */
export async function lookupWord(word: string) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  try {
    const response = await openai.chat.completions.create({
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

    if (!response.choices[0].message.content) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(response.choices[0].message.content)
    return result
  } catch (error) {
    console.error(`Failed to lookup word "${word}" with OpenAI:`, error)
    throw error
  }
}

/**
 * Fallback lookup using free dictionary API
 */
export async function lookupWordFallback(word: string) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)

    if (!response.ok) {
      throw new Error(`Dictionary API returned ${response.status}`)
    }

    const data = (await response.json()) as Array<{
      word: string
      phonetic?: string
      phonetics?: Array<{ text?: string; audio?: string }>
      meanings?: Array<{
        partOfSpeech?: string
        definitions?: Array<{
          definition: string
          example?: string
        }>
      }>
    }>

    if (!data || data.length === 0) {
      throw new Error('Word not found in dictionary')
    }

    const entry = data[0]

    // Extract phonetics
    let phoneticUs = entry.phonetic
    if (!phoneticUs && entry.phonetics && entry.phonetics.length > 0) {
      phoneticUs = entry.phonetics[0].text
    }

    // Extract meaning and examples
    let meaningEn = ''
    const examples: Array<{ en: string; cn: string }> = []

    if (entry.meanings && entry.meanings.length > 0) {
      const firstMeaning = entry.meanings[0]
      if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
        meaningEn = firstMeaning.definitions[0].definition
        if (firstMeaning.definitions[0].example) {
          examples.push({
            en: firstMeaning.definitions[0].example,
            cn: '',
          })
        }
      }
    }

    return {
      word: entry.word,
      phoneticUs,
      phoneticUk: phoneticUs, // Fallback API doesn't distinguish
      meaningCn: '',
      meaningEn,
      examples,
      imageUrl: null,
    }
  } catch (error) {
    console.error(`Failed to lookup word "${word}" with fallback API:`, error)
    throw error
  }
}
