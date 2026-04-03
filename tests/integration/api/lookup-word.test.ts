describe('AI Lookup Word API', () => {
  it('should lookup word and return definition', async () => {
    const response = await fetch('http://localhost:3000/api/ai/lookup-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: 'apple' }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.word).toBe('apple')
    expect(data.meaningCn).toBeTruthy()
    expect(data.phoneticUs).toBeTruthy()
  })

  it('should return 400 if word is missing', async () => {
    const response = await fetch('http://localhost:3000/api/ai/lookup-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(400)
  })
})
