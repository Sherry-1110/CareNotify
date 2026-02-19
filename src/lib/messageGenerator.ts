import type { FormState } from '../App'

type ContextFilePayload = {
  name: string
  type: string
  dataUrl: string
}

const TEST_LABELS: Record<string, string> = {
  chlamydia: 'Chlamydia',
  gonorrhea: 'Gonorrhea',
  syphilis: 'Syphilis',
  trichomoniasis: 'Trichomoniasis',
  hiv: 'HIV',
  hsv_1: 'HSV-1 (Herpes Simplex Virus Type 1)',
  hsv_2: 'HSV-2 (Herpes Simplex Virus Type 2)',
  mycoplasma_genitalium: 'Mycoplasma Genitalium',
}

export function getDefaultMessage(form: FormState): string {
  const name = form.partnerName || '[Name]'
  const test = TEST_LABELS[form.testResult] ?? 'an STI'
  return `Hi ${name}, I wanted to let you know I recently tested positive for ${test}. Please get tested when you can. I’m sharing this so we can both take care of our health.`
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

async function buildContextFiles(files: File[]): Promise<ContextFilePayload[]> {
  const uploads = files.slice(0, 2)
  return Promise.all(
    uploads.map(async (file) => ({
      name: file.name,
      type: file.type,
      dataUrl: await fileToDataUrl(file),
    }))
  )
}

type OpenAiResponse = {
  output_text?: string
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function generateViaFrontendOpenAI(form: FormState, contextFiles: ContextFilePayload[]): Promise<string> {
  const apiKey = normalize(import.meta.env.OPENAI_API_KEY)
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY.')
  }

  const partnerName = normalize(form.partnerName) || 'there'
  const relationship = normalize(form.partnerRelationship) || 'partner'
  const communication = normalize(form.communicationPreference) || 'message'
  const diagnosis = TEST_LABELS[form.testResult] ?? 'an STI'
  const attachmentStyle = normalize(form.attachmentStyle) || 'unspecified'

  const userContent: Array<{ type: 'input_text' | 'input_image'; text?: string; image_url?: string }> = [
    {
      type: 'input_text',
      text: [
        `Recipient name: ${partnerName}`,
        `Relationship context: ${relationship}`,
        `Preferred communication channel: ${communication}`,
        `Diagnosis to disclose: ${diagnosis}`,
        `Sender attachment style: ${attachmentStyle}`,
        'Write one concise, respectful first-person disclosure message.',
        'No blame, no legal language, no bullets, no emoji. 3-6 sentences.',
      ].join('\n'),
    },
  ]

  contextFiles.forEach((file, index) => {
    userContent.push({
      type: 'input_text',
      text: `Context image ${index + 1}: ${file.name}`,
    })
    userContent.push({
      type: 'input_image',
      image_url: file.dataUrl,
    })
  })

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: normalize(import.meta.env.OPENAI_MODEL) || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You are an empathetic health communication assistant for a patient who has recently tested positive for the specific STI below. Generate a message that is concise, respectful, and informative for them to send to the specific partner.Output only the final message text.',
            },
          ],
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.6,
      max_output_tokens: 260,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI frontend request failed (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as OpenAiResponse
  const responseText = normalize(data.output_text)
  const structuredText = normalize(
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((contentItem) => contentItem.type === 'output_text' && normalize(contentItem.text))?.text
  )
  const message = responseText || structuredText
  if (!message) {
    throw new Error('Empty OpenAI response.')
  }
  return message
}

export async function generateMessageFromForm(form: FormState): Promise<string> {
  const contextFiles = await buildContextFiles(form.lastInteractionFiles)

  const frontendApiKey = normalize(import.meta.env.OPENAI_API_KEY)
  if (frontendApiKey) {
    return generateViaFrontendOpenAI(form, contextFiles)
  }

  const response = await fetch('/api/generate-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerName: form.partnerName,
      partnerRelationship: form.partnerRelationship,
      communicationPreference: form.communicationPreference,
      testResult: form.testResult,
      attachmentStyle: form.attachmentStyle,
      contextFiles,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Failed to generate personalized message (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as { message?: string }
  if (!data.message?.trim()) {
    throw new Error('Model returned an empty message.')
  }

  return data.message.trim()
}
