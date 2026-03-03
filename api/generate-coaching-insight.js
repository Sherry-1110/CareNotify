function normalize(value) {
  return typeof value === 'string' ? value.trim() : ''
}

const COACHING_INSIGHT_SYSTEM_PROMPT = `You are the CareNotify Reaction Predictor, an AI specializing in attachment theory, communication psychology, and relationship dynamics. Your expertise lies in predicting how different personality types respond to sensitive health disclosures and preparing users for various conversation outcomes.

Your task is to generate three realistic reaction scenarios (Most Likely, Challenging, and Best Case) based on the recipient's attachment style and relationship context.

For each scenario, provide:
1. A realistic text message the recipient might send AFTER the phone call
2. The psychological reasoning behind that reaction (one sentence)
3. A copy-paste ready response that maintains boundaries while staying constructive (under 50 words)

Attachment-Based Reaction Patterns:

Secure Attachment:
- Likely: Measured surprise, practical questions, collaborative tone
- Challenging: Initial shock but quick recovery to problem-solving
- Best: Immediate support and shared responsibility

Anxious Attachment:
- Likely: Panic, catastrophizing, relationship-focused fears
- Challenging: Blame, demands for timeline details, "why me" spiraling
- Best: Seeking reassurance but accepting responsibility

Avoidant Attachment:
- Likely: Brief acknowledgment, emotional withdrawal
- Challenging: Cold dismissal, ghosting, deflection of responsibility
- Best: Practical acceptance with maintained distance

Unknown Attachment:
- Use balanced predictions incorporating elements from all styles
- Focus on universal human reactions to unexpected health news

Format your response as JSON:
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

Output only valid JSON, no other text.`

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
    testResults,
    contextFiles,
  } = req.body ?? {}

  const testResultsArray = Array.isArray(testResults) ? testResults : [testResults]
  const testLabel = testResultsArray.filter(t => t).map(t => {
    const labels = {
      chlamydia: 'Chlamydia',
      gonorrhea: 'Gonorrhea',
      syphilis: 'Syphilis',
      trichomoniasis: 'Trichomoniasis',
      hiv: 'HIV',
      hsv_1: 'HSV-1',
      hsv_2: 'HSV-2',
      mycoplasma_genitalium: 'Mycoplasma Genitalium',
    }
    return labels[t] || t
  }).join(', ') || 'STI'

  const promptParts = [
    `Recipient Name: ${normalize(partnerName) || 'there'}`,
    `Relationship: ${normalize(partnerRelationship) || 'partner'}`,
    `STI: ${testLabel}`,
    `Partner Attachment Style: ${normalize(attachmentStyle) || 'secure'}`,
  ]
  if (normalize(additionalMessage)) {
    promptParts.push(`User Context: ${additionalMessage}`)
  }

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
        max_output_tokens: 1200,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: COACHING_INSIGHT_SYSTEM_PROMPT }],
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
      console.error('OpenAI coaching insight error:', details)
      res.status(502).json({
        scenarios: [],
        attachmentStyle: normalize(attachmentStyle) || 'secure',
      })
      return
    }

    const data = await response.json()
    const rawText = normalize(data?.output_text) ||
      (data?.output
        ?.flatMap((item) => item.content ?? [])
        .find((c) => c.type === 'output_text' && normalize(c?.text))?.text) || ''

    // Strip markdown code block formatting if present
    let cleanedText = rawText.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7)
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3)
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()

    let scenarios = []

    try {
      const parsed = JSON.parse(cleanedText)
      if (Array.isArray(parsed.scenarios)) {
        scenarios = parsed.scenarios.filter(s =>
          s.type && s.title && s.theirResponse && s.whyThisReaction && s.yourBestReply
        )
      }
    } catch (parseError) {
      console.error('Failed to parse coaching insight JSON:', parseError)
    }

    res.status(200).json({
      scenarios: scenarios.length > 0 ? scenarios : [],
      attachmentStyle: normalize(attachmentStyle) || 'secure',
    })
  } catch (error) {
    console.error('generateCoachingInsight error', error)
    res.status(500).json({
      scenarios: [],
      attachmentStyle: normalize(attachmentStyle) || 'secure',
    })
  }
}
