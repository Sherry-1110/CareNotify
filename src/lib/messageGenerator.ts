import type { FormState } from '../App'
import { TIP_PROMPT_V2 } from './tipPromptV2'

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

type SelectedTest = { value: string; status: 'positive' | 'negative' | 'suspected' | 'confirmed' }

function normalizeSelectedTests(testResults: unknown): SelectedTest[] {
  if (!Array.isArray(testResults)) return []

  // Backward compat: string[] means positive
  if (testResults.every((t) => typeof t === 'string')) {
    return (testResults as string[])
      .filter((t) => t.length > 0)
      .map((value) => ({ value, status: 'positive' }))
  }

  return (testResults as Array<Partial<SelectedTest>>)
    .filter((t) => typeof t?.value === 'string' && t.value.length > 0)
    .map((t) => ({
      value: t.value as string,
      status:
        t.status === 'suspected'
          ? 'suspected'
          : t.status === 'negative'
            ? 'negative'
            : t.status === 'confirmed'
              ? 'positive'
              : 'positive',
    }))
}

function getTestLabel(testResults: unknown): string {
  const selected = normalizeSelectedTests(testResults)
  if (selected.length > 0) {
    const labels = selected.map((t) => TEST_LABELS[t.value] ?? t.value)
    return labels.join(', ')
  }

  if (typeof testResults === 'string' && testResults) return TEST_LABELS[testResults] ?? testResults
  return 'an STI'
}

function getDiagnosesStatusSummary(testResults: unknown): { positive: string[]; suspected: string[]; negative: string[] } {
  const selected = normalizeSelectedTests(testResults)
  const positive: string[] = []
  const suspected: string[] = []
  const negative: string[] = []

  selected.forEach(({ value, status }) => {
    const label = TEST_LABELS[value] ?? value
    if (status === 'suspected') suspected.push(label)
    else if (status === 'negative') negative.push(label)
    else positive.push(label)
  })

  return { positive, suspected, negative }
}

export function getDefaultMessage(form: FormState): string {
  const name = form.partnerName || '[Name]'
  const { positive, suspected } = getDiagnosesStatusSummary(form.testResults)

  const parts: string[] = []
  if (positive.length > 0) {
    parts.push(`I wanted to let you know I recently tested positive for ${positive.join(', ')}.`)
  }
  if (suspected.length > 0) {
    const suspectedLabel = suspected.join(', ')
    parts.push(`I also want to share there’s a chance I may have ${suspectedLabel} (not confirmed yet).`)
  }

  const disclosure = parts.length > 0 ? parts.join(' ') : 'I wanted to let you know I recently tested positive for an STI.'
  return `Hi ${name}, ${disclosure} Please get tested when you can. I'm sharing this so we can both take care of our health.`
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

function normalizeAttachmentStyle(value: unknown): string {
  const candidate = normalize(value).toLowerCase()
  if (candidate === 'secure' || candidate === 'anxious' || candidate === 'avoidant' || candidate === 'disorganized') {
    return candidate
  }
  return ''
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
  const { positive, suspected } = getDiagnosesStatusSummary(form.testResults)
  const diagnosis =
    positive.length || suspected.length
      ? [
          positive.length ? `positive: ${positive.join(', ')}` : '',
          suspected.length ? `suspected: ${suspected.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join(' | ')
      : 'an STI'
  const attachmentStyle = normalizeAttachmentStyle(form.attachmentStyle) || 'secure'
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
  const selectedAttachmentStyle = normalizeAttachmentStyle(form.attachmentStyle)

  if (frontendApiKey) {
    // Respect explicit user selection from Step 3; only infer as fallback.
    const attachmentStyle =
      selectedAttachmentStyle ||
      (await determineAttachmentStyleViaFrontendOpenAI(form, contextFiles, frontendApiKey))

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
      testResults: form.testResults,
      attachmentStyle: normalizeAttachmentStyle(form.attachmentStyle),
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

export type ReactionScenario = {
  title: string
  type: 'likely' | 'challenging' | 'best'
  theirResponse: string
  whyThisReaction: string
  yourBestReply: string
}

export type CoachingInsight = {
  scenarios: ReactionScenario[]
  attachmentStyle: string
}

function getFallbackCoachingInsight(attachmentStyle: string): CoachingInsight {
  return {
    attachmentStyle,
    scenarios: [
      {
        type: 'likely',
        title: 'Most Likely Reaction',
        theirResponse: 'Thanks for telling me. I need a little time to process this.',
        whyThisReaction: 'People often need time to regulate emotions after a difficult health conversation.',
        yourBestReply: "Totally understood. Take the time you need, and I'm here when you're ready.",
      },
      {
        type: 'challenging',
        title: 'Challenging Reaction',
        theirResponse: 'I feel overwhelmed and upset right now.',
        whyThisReaction: 'Stress reactions can show up as withdrawal, blame, or emotional intensity.',
        yourBestReply: "I hear you. I'm not here to blame anyone, just to share this responsibly and keep us both safe.",
      },
      {
        type: 'best',
        title: 'Best Case Reaction',
        theirResponse: "Thanks for being honest. Let's figure out next steps.",
        whyThisReaction: 'Clear and respectful disclosure can create space for cooperative problem-solving.',
        yourBestReply: "I really appreciate that. Let's handle this calmly and make sure we're both taken care of.",
      },
    ],
  }
}

function repairLikelyJsonFormattingIssues(input: string): string {
  return input
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/:\s*\\+"/g, ': "')
    .replace(/\\+"\s*([,}\]])/g, '"$1')
    .replace(/,\s*([}\]])/g, '$1')
}

function extractPrimaryJsonObject(input: string): string {
  const firstBrace = input.indexOf('{')
  const lastBrace = input.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace <= firstBrace) return input
  return input.slice(firstBrace, lastBrace + 1)
}

function parseCoachingInsightResponse(raw: string): CoachingInsight | null {
  const candidates = [
    raw.trim(),
    extractPrimaryJsonObject(raw.trim()),
    repairLikelyJsonFormattingIssues(raw.trim()),
    repairLikelyJsonFormattingIssues(extractPrimaryJsonObject(raw.trim())),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<CoachingInsight>
      if (!Array.isArray(parsed.scenarios)) continue
      return {
        attachmentStyle: normalize(parsed.attachmentStyle) || 'secure',
        scenarios: parsed.scenarios as ReactionScenario[],
      }
    } catch {
      // Continue trying other repaired variants.
    }
  }

  return null
}
const CALL_SCRIPT_SYSTEM_PROMPT = `System Role: You are an empathetic, emotionally intelligent communication coach for CareNotify. Your task is to translate a user’s raw inputs about an STI diagnosis into a short phone call script that helps them communicate the news clearly, calmly, and responsibly. The script should help the user stay grounded during a difficult conversation while encouraging the recipient to get tested. 

Core Objective: Generate a simple spoken script that communicates the STI diagnosis clearly, encourages the recipient to get tested, maintains a calm and blame-free tone, and helps the user stay composed during a live conversation. The script should feel natural to say out loud and not sound like a prepared speech. 

Input Variables: 
- Recipient Name: {{recipient_name}} 
- Relationship: {{relationship_type}} 
- STI: {{sti_name}} 
- Partner Attachment Style: {{attachment_style}} (Secure, Anxious, Avoidant) 
- User Context: {{additional_message_content}} 
- Optional Emotional Inputs: 
- User Emotional State: {{user_feelings_about_conversation}} 
- Feared Reactions: {{anticipated_reactions}} 

Output Format: Generate a simple conversational structure with four parts: Opening, The News, Call to Action, and Closing/Space for Response. Each section should be 1–2 sentences maximum. The total script should be no more than 6–8 sentences and must sound natural when spoken. 

The “CareNotify Voice” (Design Language): 
- Normalize, Don’t Stigmatize — Treat the STI as a health situation to manage rather than a moral failure. Use phrases like “taking care of my health,” “handling this,” or “wanted to be responsible.” Avoid language implying blame. 
- Connection over Transaction — Even for ex-partners, acknowledge the human connection. Use natural phrases such as “I wanted to tell you directly” or “I thought it was important you hear this from me.” 
- Clear Call to Action — The recipient must clearly understand they should get tested. Use calm language such as “It would be a good idea for you to get tested too.” 

Tailoring Strategy (Psychological Nuance): 
- If Secure — Be open and collaborative, such as “I wanted to tell you directly so we can both take care of this.” 
- If Anxious — Reduce panic and uncertainty by emphasizing that it is manageable and that the user is already handling it. For example, “It’s something that’s very treatable and I’m taking care of it.” 
- If Avoidant — Keep the message short and factual without demanding emotional processing, such as “I just wanted to let you know so you can get tested if needed.” 

Emotional Support Integration: 
- If the user provides emotional context, adapt the script accordingly. 
- If the user feels nervous or scared, include a grounding opening such as “I wanted to call because I think it’s better to say this directly.” 
- If they fear anger or blame, frame the call as responsible care rather than confession, for example “I’m sharing this because I think it’s important we both take care of our health.” 

Critical Constraints: 
- Do not include apologies or phrases such as “sorry,” “apologize,” or “regret.” Notification is an act of responsibility, not wrongdoing. 
- Do not provide medical advice or suggest specific treatments. Only recommend that the recipient get tested. 
- Ensure the script sounds natural in conversation, avoiding robotic phrasing, overly formal language, or long sentences.

Output only the final phone script following the structure above.`

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
async function generateCallScriptViaFrontendOpenAI(
  form: FormState,
  contextFiles: ContextFilePayload[],
  apiKey: string
): Promise<string> {
  const partnerName = normalize(form.partnerName) || 'there'
  const relationship = normalize(form.partnerRelationship) || 'partner'
  const diagnosis = getTestLabel(form.testResults)
  const attachmentStyle = normalizeAttachmentStyle(form.attachmentStyle) || 'secure'
  const additionalMessage = normalize(form.additionalMessage)
  const callConversationFeeling = normalize(form.callConversationFeeling)
  const callReactionFears = normalize(form.callReactionFears)

  const promptParts = [
    `Recipient Name: ${partnerName}`,
    `Relationship: ${relationship}`,
    `STI: ${diagnosis}`,
    `Partner Attachment Style: ${attachmentStyle}`,
  ]

  if (additionalMessage) {
    promptParts.push(`User Context: ${additionalMessage}`)
  }
  if (callConversationFeeling) {
    promptParts.push(`User Emotional State: ${callConversationFeeling}`)
  }
  if (callReactionFears) {
    promptParts.push(`Feared Reactions: ${callReactionFears}`)
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
              text: CALL_SCRIPT_SYSTEM_PROMPT,
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
    throw new Error(`OpenAI call script request failed (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as OpenAiResponse
  const responseText = normalize(data.output_text)
  const structuredText = normalize(
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((contentItem) => contentItem.type === 'output_text' && normalize(contentItem.text))?.text
  )

  const script = responseText || structuredText
  if (!script) {
    throw new Error('Empty OpenAI call script response.')
  }

  return script
}
async function generateGuidanceViaFrontendOpenAI(
  form: FormState,
  contextFiles: ContextFilePayload[],
  apiKey: string,
  draftedMessage: string
): Promise<AttachmentGuidance> {
  const partnerName = normalize(form.partnerName) || 'there'
  const relationship = normalize(form.partnerRelationship) || 'partner'
  const { positive, suspected } = getDiagnosesStatusSummary(form.testResults)
  const diagnosis =
    positive.length || suspected.length
      ? [
          positive.length ? `positive: ${positive.join(', ')}` : '',
          suspected.length ? `suspected: ${suspected.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join(' | ')
      : 'an STI'
  const attachmentStyle = normalizeAttachmentStyle(form.attachmentStyle) || 'secure'
  const additionalMessage = normalize(form.additionalMessage)

  const promptParts = [
    `recipient_name: ${partnerName}`,
    `relationship_type: ${relationship}`,
    `sti_name: ${diagnosis}`,
    `attachment_style: ${attachmentStyle}`,
  ]

  if (additionalMessage) {
    promptParts.push(`user_notes: ${additionalMessage}`)
  }

  promptParts.push(
    'original_message: "(User did not provide an original draft—treat the improved message as the current draft and validate why it works.)"',
    '',
    `improved_message: "${draftedMessage.replace(/"/g, '\\"')}"`
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
              text: TIP_PROMPT_V2,
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

  // Strip markdown code block formatting if present
  let cleanedResponse = rawResponse.trim()
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7)
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3)
  }
  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3)
  }
  cleanedResponse = cleanedResponse.trim()

  try {
    const parsed = JSON.parse(cleanedResponse) as AttachmentGuidance
    return {
      attachmentStyle: normalize(parsed.attachmentStyle) || 'secure',
      tip: normalize(parsed.tip) || "Keep the message clear, non-blaming, and focused on shared health.",
      positiveNote: normalize(parsed.positiveNote) || "You're taking a positive step. Being open about sexual health builds trust.",
    }
  } catch {
    // Tip prompt v2 returns plain text only (coach's note)
    const tipText = cleanedResponse || "Keep the message clear, non-blaming, and focused on shared health."
    return {
      attachmentStyle: 'secure',
      tip: tipText,
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
      testResults: form.testResults,
      additionalMessage: form.additionalMessage,
      attachmentStyle: normalizeAttachmentStyle(form.attachmentStyle),
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

export async function generateCallScriptFromForm(form: FormState): Promise<string> {
  const contextFiles = await buildContextFiles(form.lastInteractionFiles)
  const frontendApiKey = getOpenAIKey()
  const selectedAttachmentStyle = normalizeAttachmentStyle(form.attachmentStyle)

  if (frontendApiKey) {
    const attachmentStyle =
      selectedAttachmentStyle ||
      (await determineAttachmentStyleViaFrontendOpenAI(form, contextFiles, frontendApiKey))

    const formWithStyle: FormState = { ...form, attachmentStyle: attachmentStyle as FormState['attachmentStyle'] }
    return generateCallScriptViaFrontendOpenAI(formWithStyle, contextFiles, frontendApiKey)
  }

  const response = await fetch('/api/generate-call-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerName: form.partnerName,
      partnerRelationship: form.partnerRelationship,
      additionalMessage: form.additionalMessage,
      callConversationFeeling: form.callConversationFeeling,
      callReactionFears: form.callReactionFears,
      attachmentStyle: normalizeAttachmentStyle(form.attachmentStyle),
      testResults: form.testResults,
      contextFiles,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Failed to generate call script (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as { script?: string }
  if (!data.script?.trim()) {
    throw new Error('Model returned an empty call script.')
  }

  return data.script.trim()
}

async function generateCoachingInsightViaFrontendOpenAI(
  form: FormState,
  contextFiles: ContextFilePayload[],
  apiKey: string
): Promise<CoachingInsight> {
  const partnerName = normalize(form.partnerName) || 'there'
  const relationship = normalize(form.partnerRelationship) || 'partner'
  const diagnosis = getTestLabel(form.testResults)
  const attachmentStyle = normalizeAttachmentStyle(form.attachmentStyle) || 'secure'
  const additionalMessage = normalize(form.additionalMessage)
  const callConversationFeeling = normalize(form.callConversationFeeling)
  const callReactionFears = normalize(form.callReactionFears)

  console.log('Generating coaching insight with:', {
    partnerName,
    relationship,
    diagnosis,
    attachmentStyle,
    callConversationFeeling,
    callReactionFears,
  })

  const promptParts = [
    `Recipient Name: ${partnerName}`,
    `Relationship: ${relationship}`,
    `STI: ${diagnosis}`,
    `Partner Attachment Style: ${attachmentStyle}`,
  ]

  if (additionalMessage) {
    promptParts.push(`User Context: ${additionalMessage}`)
  }
  if (callConversationFeeling) {
    promptParts.push(`Caller Emotional State: ${callConversationFeeling}`)
  }
  if (callReactionFears) {
    promptParts.push(`Expected/Fearful Reactions: ${callReactionFears}`)
  }

  const coachingPrompt = `You are the CareNotify Reaction Predictor, specializing in attachment theory and communication psychology. Your task is to generate three realistic reaction scenarios (Most Likely, Challenging, and Best Case) for a phone call disclosure about an STI diagnosis.

Input:
${promptParts.join('\n')}

Using attachment theory and relationship dynamics, generate exactly three scenarios:

1. Most Likely Reaction (📊)
2. Challenging Reaction (😰)  
3. Best Case Reaction (💚)

For each scenario provide:
- A realistic message they might send AFTER the call
- One-sentence psychological reasoning
- A copy-paste ready response (under 50 words)

Format your response as JSON with this structure:
{
  "scenarios": [
    {
      "type": "likely",
      "title": "Most Likely Reaction",
      "theirResponse": "...",
      "whyThisReaction": "...",
      "yourBestReply": "..."
    },
    {
      "type": "challenging",
      "title": "Challenging Reaction",
      "theirResponse": "...",
      "whyThisReaction": "...",
      "yourBestReply": "..."
    },
    {
      "type": "best",
      "title": "Best Case Reaction",
      "theirResponse": "...",
      "whyThisReaction": "...",
      "yourBestReply": "..."
    }
  ]
}

Output only valid JSON.`

  const userContent: Array<{ type: 'input_text' | 'input_image'; text?: string; image_url?: string }> = [
    {
      type: 'input_text',
      text: coachingPrompt,
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
              text: `You are the CareNotify Reaction Predictor, an AI specializing in attachment theory, communication psychology, and relationship dynamics. Your expertise lies in predicting how different personality types respond to sensitive health disclosures and preparing users for various conversation outcomes. You combine behavioral science with practical communication strategies to help users navigate potentially difficult reactions with confidence and grace.`,
            },
          ],
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.7,
      max_output_tokens: 1200,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    console.error('OpenAI coaching insight API error:', response.status, details)
    throw new Error(`OpenAI coaching insight request failed (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as OpenAiResponse
  console.log('OpenAI response data:', data)
  const responseText = normalize(data.output_text)
  const structuredText = normalize(
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((contentItem) => contentItem.type === 'output_text' && normalize(contentItem.text))?.text
  )

  const rawResponse = responseText || structuredText
  console.log('Raw coaching insight response:', rawResponse)
  if (!rawResponse) {
    throw new Error('Empty OpenAI coaching insight response.')
  }

  // Strip markdown code block formatting if present
  let cleanedResponse = rawResponse.trim()
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7) // Remove ```json
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3) // Remove ```
  }
  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3) // Remove trailing ```
  }
  cleanedResponse = cleanedResponse.trim()

  const parsed = parseCoachingInsightResponse(cleanedResponse)
  if (parsed) {
    console.log('Parsed coaching insight:', parsed)
    return {
      scenarios: parsed.scenarios || [],
      attachmentStyle,
    }
  }

  console.error('Failed to parse coaching insight JSON after repair attempts. Raw response:', rawResponse)
  return getFallbackCoachingInsight(attachmentStyle)
}

export async function generateCoachingInsightFromForm(form: FormState): Promise<CoachingInsight> {
  const contextFiles = await buildContextFiles(form.lastInteractionFiles)
  const frontendApiKey = getOpenAIKey()
  const selectedAttachmentStyle = normalizeAttachmentStyle(form.attachmentStyle)

  if (frontendApiKey) {
    // Determine attachment style if not already set
    const attachmentStyle =
      selectedAttachmentStyle ||
      (await determineAttachmentStyleViaFrontendOpenAI(form, contextFiles, frontendApiKey))

    const formWithStyle: FormState = { ...form, attachmentStyle: attachmentStyle as FormState['attachmentStyle'] }
    return generateCoachingInsightViaFrontendOpenAI(formWithStyle, contextFiles, frontendApiKey)
  }

  const response = await fetch('/api/generate-coaching-insight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerName: form.partnerName,
      partnerRelationship: form.partnerRelationship,
      additionalMessage: form.additionalMessage,
      callConversationFeeling: form.callConversationFeeling,
      callReactionFears: form.callReactionFears,
      attachmentStyle: normalizeAttachmentStyle(form.attachmentStyle),
      testResults: form.testResults,
      contextFiles,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Failed to generate coaching insight (${response.status}): ${details || 'no details'}`)
  }

  const data = (await response.json()) as CoachingInsight
  return {
    scenarios: data.scenarios || [],
    attachmentStyle: normalizeAttachmentStyle(data.attachmentStyle) || normalizeAttachmentStyle(form.attachmentStyle) || 'secure',
  }
}
