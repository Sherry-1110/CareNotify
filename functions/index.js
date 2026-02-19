const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

const openAiApiKey = defineSecret('OPENAI_API_KEY')

const RELATIONSHIP_LABELS = {
  current_partner: 'current partner',
  previous_partner: 'previous partner',
  future_partner: 'future partner',
}

const COMMUNICATION_LABELS = {
  text: 'text message',
  call: 'phone call',
}

const TEST_LABELS = {
  chlamydia: 'Chlamydia',
  gonorrhea: 'Gonorrhea',
  syphilis: 'Syphilis',
  trichomoniasis: 'Trichomoniasis',
  hiv: 'HIV',
  hsv_1: 'HSV-1 (Herpes Simplex Virus Type 1)',
  hsv_2: 'HSV-2 (Herpes Simplex Virus Type 2)',
  mycoplasma_genitalium: 'Mycoplasma Genitalium',
}

const ATTACHMENT_STYLE_LABELS = {
  secure: 'secure',
  anxious: 'anxious',
  avoidant: 'avoidant',
  disorganized: 'disorganized',
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

exports.generateMessage = onRequest({ cors: true, secrets: [openAiApiKey] }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const {
    partnerName,
    partnerRelationship,
    communicationPreference,
    testResult,
    attachmentStyle,
    contextFiles,
  } = req.body ?? {}

  const safePartnerName = normalizeString(partnerName) || 'there'
  const relationshipLabel = RELATIONSHIP_LABELS[partnerRelationship] || 'partner'
  const communicationLabel = COMMUNICATION_LABELS[communicationPreference] || 'message'
  const testLabel = TEST_LABELS[testResult] || 'an STI'
  const attachmentStyleLabel = ATTACHMENT_STYLE_LABELS[attachmentStyle] || 'unspecified'
  const files = Array.isArray(contextFiles) ? contextFiles.slice(0, 2) : []

  if (!testResult) {
    res.status(400).json({ error: 'Missing test result.' })
    return
  }

  try {
    const systemPrompt = [
      'You are an empathetic health communication assistant.',
      'Write one short first-person disclosure message from person 1 to person 2 after an STI diagnosis.',
      'The message must be respectful, non-accusatory, direct, and trauma-informed.',
      'Prioritize emotional safety, clarity, and consent-based language.',
      'Include the diagnosis, suggest testing soon, and avoid blame or legal advice.',
      'Do not include placeholders, bullet points, headings, signatures, or emojis.',
      'Output only the final message text.',
    ].join(' ')

    const userContext = [
      `Recipient name: ${safePartnerName}`,
      `Relationship context: ${relationshipLabel}`,
      `Preferred communication channel: ${communicationLabel}`,
      `Diagnosis to disclose: ${testLabel}`,
      `Sender attachment style: ${attachmentStyleLabel}`,
      'If images are attached, infer relevant emotional/contextual tone and incorporate it softly without making unverifiable claims.',
      'Target length: 3-6 concise sentences.',
    ].join('\n')

    const userContent = [{ type: 'input_text', text: userContext }]

    files.forEach((file, index) => {
      const imageUrl = normalizeString(file?.dataUrl)
      if (!imageUrl) return

      userContent.push({
        type: 'input_text',
        text: `Context image ${index + 1}: ${normalizeString(file?.name) || 'uploaded image'}`,
      })
      userContent.push({
        type: 'input_image',
        image_url: imageUrl,
      })
    })

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey.value()}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        temperature: 0.6,
        max_output_tokens: 260,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }],
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('OpenAI API error:', errorBody)
      res.status(502).json({ error: 'Failed to generate message.' })
      return
    }

    const data = await response.json()
    const message = normalizeString(data?.output_text)

    if (!message) {
      res.status(502).json({ error: 'Model returned an empty response.' })
      return
    }

    res.status(200).json({ message })
  } catch (error) {
    console.error('generateMessage error', error)
    res.status(500).json({ error: 'Unexpected server error.' })
  }
})
