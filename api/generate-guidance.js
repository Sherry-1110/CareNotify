function normalize(value) {
  return typeof value === 'string' ? value.trim() : ''
}

const COACH_SYSTEM_PROMPT = `You are the "CareNotify Coach." Your goal is to validate the user's situation and explain why the drafted message is effective. You are empowering, educational, and calming.

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

Format your response as JSON with exactly these keys: attachmentStyle, tip, positiveNote.
Output only the JSON, no other text.`

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not configured.' })
    return
  }

  const {
    partnerName,
    partnerRelationship,
    additionalMessage,
    attachmentStyle,
    draftedMessage,
    contextFiles,
  } = req.body ?? {}

  const style = normalize(attachmentStyle) || 'secure'
  const promptParts = [
    `Recipient Name: ${normalize(partnerName) || 'there'}`,
    `Relationship: ${normalize(partnerRelationship) || 'partner'}`,
  ]
  if (normalize(additionalMessage)) {
    promptParts.push(`User Notes: ${additionalMessage}`)
  }
  promptParts.push('', `Drafted Message: "${normalize(draftedMessage) || ''}"`)

  const userContent = [{ type: 'input_text', text: promptParts.join('\n') }]
  const files = Array.isArray(contextFiles) ? contextFiles.slice(0, 2) : []
  files.forEach((file, index) => {
    const dataUrl = normalize(file?.dataUrl)
    if (!dataUrl) return
    userContent.push({
      type: 'input_text',
      text: `Context image ${index + 1}: ${normalize(file?.name) || 'uploaded image'}`,
    })
    userContent.push({
      type: 'input_image',
      image_url: dataUrl,
    })
  })

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        temperature: 0.7,
        max_output_tokens: 300,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: COACH_SYSTEM_PROMPT }],
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      }),
    })

    if (!response.ok) {
      const details = await response.text()
      console.error('OpenAI guidance error:', details)
      res.status(502).json({
        attachmentStyle: style,
        tip: "Keep the message clear, non-blaming, and focused on shared health.",
        positiveNote: "You're taking a positive step. Being open about sexual health builds trust.",
      })
      return
    }

    const data = await response.json()
    const rawText = normalize(data?.output_text) ||
      (data?.output
        ?.flatMap((item) => item.content ?? [])
        .find((c) => c.type === 'output_text' && normalize(c?.text))?.text) || ''

    let attachmentStyleOut = style
    let tip = "Keep the message clear, non-blaming, and focused on shared health."
    let positiveNote = "You're taking a positive step. Being open about sexual health builds trust."

    try {
      const parsed = JSON.parse(rawText)
      if (parsed.attachmentStyle) attachmentStyleOut = normalize(parsed.attachmentStyle) || style
      if (parsed.tip) tip = normalize(parsed.tip)
      if (parsed.positiveNote) positiveNote = normalize(parsed.positiveNote)
    } catch {
      // keep defaults
    }

    res.status(200).json({
      attachmentStyle: attachmentStyleOut,
      tip,
      positiveNote,
    })
  } catch (error) {
    console.error('generateGuidance error', error)
    res.status(500).json({
      attachmentStyle: style,
      tip: "Keep the message clear, non-blaming, and focused on shared health.",
      positiveNote: "You're taking a positive step. Being open about sexual health builds trust.",
    })
  }
}
