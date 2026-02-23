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

function getTestLabel(testResults: unknown): string {
  if (Array.isArray(testResults)) {
    const labels = testResults
      .filter((t): t is string => typeof t === 'string' && t.length > 0)
      .map((t) => TEST_LABELS[t] ?? t)
    return labels.length > 0 ? labels.join(', ') : 'an STI'
  }

  if (typeof testResults === 'string' && testResults) {
    return TEST_LABELS[testResults] ?? testResults
  }

  return 'an STI'
}

export function getDefaultMessage(form: FormState): string {
  const name = form.partnerName || '[Name]'
  const test = getTestLabel(form.testResults)
  return `Hi ${name}, I wanted to let you know I recently tested positive for ${test}. Please get tested when you can. I'm sharing this so we can both take care of our health.`
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

function getOpenAIKey(): string {
  return normalize(import.meta.env.VITE_OPENAI_API_KEY) || normalize(import.meta.env.OPENAI_API_KEY)
}

async function generateViaFrontendOpenAI(
  form: FormState,
  contextFiles: ContextFilePayload[],
  apiKey: string
): Promise<string> {
  const partnerName = normalize(form.partnerName) || 'there'
  const relationship = normalize(form.partnerRelationship) || 'partner'
  const diagnosis = getTestLabel(form.testResults)
  const attachmentStyle = normalize(form.attachmentStyle) || 'secure'
  const additionalMessage = normalize(form.additionalMessage)

  const promptParts = [
    `Recipient Name: ${partnerName}`,
    `Relationship: ${relationship}`,
    `STI: ${diagnosis}`,
    `Partner Attachment Style: ${attachmentStyle}`,
  ]

  if (additionalMessage) {
    promptParts.push(`User Context: ${additionalMessage}`)
  }

  const userContent: Array<{ type: 'input_text' | 'input_image'; text?: string; image_url?: string }> = [
    {
      type: 'input_text',
      text: promptParts.join('\n'),
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
      model: normalize(import.meta.env.VITE_OPENAI_MODEL) || normalize(import.meta.env.OPENAI_MODEL) || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: `You are an empathetic, emotionally intelligent communication coach for CareNotify. Your task is to translate a user's raw inputs about an STI diagnosis into a text message that is supportive, normalizing, and responsible.

Core Objective: Generate a message that is highly empathetic and positive, yet respectfully acknowledges the seriousness of the situation. It must prompt the recipient to get tested while maintaining a calm, blame-free environment.

The "CareNotify Voice" (Design Language):
- Normalize, Don't Stigmatize: Treat the STI as a health task to be managed, not a moral failing. Use phrases like "handling this," "taking care of my health," or "wanted to be responsible."
- Connection over Transaction: Even for ex-partners, acknowledge the human connection. Avoid robotic or purely clinical language.
- Clear Call to Action: The empathy must lead to action. The recipient must understand they need to get tested.

Tailoring Strategy (Psychological Nuance):
- If Secure: Be direct and collaborative. "I wanted to be open with you so we can both take care of this."
- If Anxious: Be extra reassuring. Emphasize that it is manageable/treatable to reduce panic.
- If Avoidant: Be concise and respectful of space. Give them the facts without demanding an emotional response.

Critical Constraints:
- No Apologies: Do not use "sorry" or "regret." Apologizing implies guilt; notification is an act of care.
- No Medical Advice: Do not suggest specific treatments.
- Length: Keep it natural for SMS (under 250 characters).

Output only the final message text.`,
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
  const result = await generateMessageAndStyleFromForm(form)
  return result.message
}

export type MessageWithStyle = {
  message: string
  attachmentStyle: string
}

export async function generateMessageAndStyleFromForm(form: FormState): Promise<MessageWithStyle> {
  const contextFiles = await buildContextFiles(form.lastInteractionFiles)
  const frontendApiKey = getOpenAIKey()

  if (frontendApiKey) {
    // First determine attachment style from context
    const attachmentStyle = await determineAttachmentStyleViaFrontendOpenAI(form, contextFiles, frontendApiKey)
    
    // Then generate message with that style
    const formWithStyle: FormState = { ...form, attachmentStyle: attachmentStyle as FormState['attachmentStyle'] }
    const message = await generateViaFrontendOpenAI(formWithStyle, contextFiles, frontendApiKey)
    
    return { message, attachmentStyle }
  }

  const response = await fetch('/api/generate-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerName: form.partnerName,
      partnerRelationship: form.partnerRelationship,
      communicationPreference: form.communicationPreference,
      testResult: form.testResults[0] ?? '',
      attachmentStyle: form.attachmentStyle,
      additionalMessage: form.additionalMessage,
      contextFiles,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Failed to generate personalized message (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as { message?: string; attachmentStyle?: string }
  if (!data.message?.trim()) {
    throw new Error('Model returned an empty message.')
  }

  return {
    message: data.message.trim(),
    attachmentStyle: normalize(data.attachmentStyle) || 'secure',
  }
}

export type AttachmentGuidance = {
  attachmentStyle: string
  tip: string
  positiveNote: string
}
// First determine attachment style from context
async function determineAttachmentStyleViaFrontendOpenAI(
  form: FormState,
  contextFiles: ContextFilePayload[],
  apiKey: string
): Promise<string> {
  const partnerName = normalize(form.partnerName) || 'there'
  const relationship = normalize(form.partnerRelationship) || 'partner'
  const additionalMessage = normalize(form.additionalMessage)

  const promptParts = [
    `Recipient Name: ${partnerName}`,
    `Relationship: ${relationship}`,
  ]

  if (additionalMessage) {
    promptParts.push(`User Context: ${additionalMessage}`)
  }

  promptParts.push(
    '',
    'Based on the context above and the provided images (if any), analyze the relationship dynamics and determine the likely attachment style of the partner.',
    '',
    'Respond with only one word: secure, anxious, avoidant, or disorganized'
  )

  const userContent: Array<{ type: 'input_text' | 'input_image'; text?: string; image_url?: string }> = [
    {
      type: 'input_text',
      text: promptParts.join('\n'),
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
      model: normalize(import.meta.env.VITE_OPENAI_MODEL) || normalize(import.meta.env.OPENAI_MODEL) || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You are an expert in attachment theory and relationship dynamics. Analyze the provided context to determine the partner\'s likely attachment style.',
            },
          ],
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.5,
      max_output_tokens: 50,
    }),
  })

  if (!response.ok) {
    return 'secure' // fallback
  }

  const data = (await response.json()) as OpenAiResponse
  const responseText = normalize(data.output_text)
  const structuredText = normalize(
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((contentItem) => contentItem.type === 'output_text' && normalize(contentItem.text))?.text
  )

  const style = (responseText || structuredText).toLowerCase()
  if (['secure', 'anxious', 'avoidant', 'disorganized'].includes(style)) {
    return style
  }
  
  return 'secure'
}
async function generateGuidanceViaFrontendOpenAI(
  form: FormState,
  contextFiles: ContextFilePayload[],
  apiKey: string,
  draftedMessage: string
): Promise<AttachmentGuidance> {
  const partnerName = normalize(form.partnerName) || 'there'
  const relationship = normalize(form.partnerRelationship) || 'partner'
  const diagnosis = getTestLabel(form.testResults)
  const attachmentStyle = normalize(form.attachmentStyle) || 'secure'
  const additionalMessage = normalize(form.additionalMessage)

  const promptParts = [
    `Recipient Name: ${partnerName}`,
    `Relationship: ${relationship}`,
    `STI: ${diagnosis}`,
    `Partner Attachment Style: ${attachmentStyle}`,
  ]

  if (additionalMessage) {
    promptParts.push(`User Notes: ${additionalMessage}`)
  }

  promptParts.push('', `Drafted Message: "${draftedMessage}"`)

  const userContent: Array<{ type: 'input_text' | 'input_image'; text?: string; image_url?: string }> = [
    {
      type: 'input_text',
      text: promptParts.join('\n'),
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
      model: normalize(import.meta.env.VITE_OPENAI_MODEL) || normalize(import.meta.env.OPENAI_MODEL) || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: `You are the "CareNotify Coach." Your goal is to validate the user's situation and explain why the drafted message is effective. You are empowering, educational, and calming.

Core Objective: Generate a short, empowering "Coach's Note" (max 2-3 sentences) that explains the strategy behind the drafted message.

The "Coach's Voice" (Design Language):
- Validate the Difficulty: Acknowledge that sending this is hard, but they are doing the right thing.
- Explain the Strategy: Briefly explain why specific words were chosen (e.g., "Using 'we' instead of 'you' reduces defensiveness").
- Reinforce Safety: Remind them that this approach protects their dignity and the recipient's feelings.

Logic for "Why this works":
- If Attachment Style is Secure: "This draft uses direct honesty, which honors the trust in your relationship."
- If Attachment Style is Anxious: "This draft offers clear reassurance to prevent them from spiraling or panicking."
- If Attachment Style is Avoidant: "This draft keeps it brief and factual, giving them the space they need to process it alone."
- If Ex-Partner: "This draft maintains a respectful boundary while fulfilling your responsibility."

Also provide a short positive affirmation (1 sentence) that validates their courage in taking this step.

Format your response as JSON:
{"attachmentStyle": "${attachmentStyle}", "tip": "...", "positiveNote": "..."}

Output only the JSON.`,
            },
          ],
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.7,
      max_output_tokens: 300,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI guidance request failed (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as OpenAiResponse
  const responseText = normalize(data.output_text)
  const structuredText = normalize(
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((contentItem) => contentItem.type === 'output_text' && normalize(contentItem.text))?.text
  )

  const rawResponse = responseText || structuredText
  if (!rawResponse) {
    throw new Error('Empty OpenAI guidance response.')
  }

  try {
    const parsed = JSON.parse(rawResponse) as AttachmentGuidance
    return {
      attachmentStyle: normalize(parsed.attachmentStyle) || 'secure',
      tip: normalize(parsed.tip) || "Keep the message clear, non-blaming, and focused on shared health.",
      positiveNote: normalize(parsed.positiveNote) || "You're taking a positive step. Being open about sexual health builds trust.",
    }
  } catch {
    // Fallback if JSON parsing fails
    return {
      attachmentStyle: 'secure',
      tip: "Keep the message clear, non-blaming, and focused on shared health.",
      positiveNote: "You're taking a positive step. Being open about sexual health builds trust.",
    }
  }
}

export async function generateGuidanceFromForm(form: FormState, draftedMessage: string): Promise<AttachmentGuidance> {
  const contextFiles = await buildContextFiles(form.lastInteractionFiles)
  const frontendApiKey = getOpenAIKey()

  if (frontendApiKey) {
    return generateGuidanceViaFrontendOpenAI(form, contextFiles, frontendApiKey, draftedMessage)
  }

  const response = await fetch('/api/generate-guidance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerName: form.partnerName,
      partnerRelationship: form.partnerRelationship,
      additionalMessage: form.additionalMessage,
      attachmentStyle: form.attachmentStyle,
      draftedMessage,
      contextFiles,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Failed to generate guidance (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as AttachmentGuidance
  return {
    attachmentStyle: normalize(data.attachmentStyle) || 'secure',
    tip: normalize(data.tip) || "Keep the message clear, non-blaming, and focused on shared health.",
    positiveNote: normalize(data.positiveNote) || "You're taking a positive step. Being open about sexual health builds trust.",
  }
}
