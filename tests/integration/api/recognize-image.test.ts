describe('AI Recognize Image API', () => {
  it('should recognize words from image', async () => {
    // Mock base64 image (tiny 1x1 pixel)
    const mockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    const response = await fetch('http://localhost:3000/api/ai/recognize-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: mockImage }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data.words)).toBe(true)
  }, 30000) // Increased timeout to 30 seconds for OpenAI API call
})
