function normalize(value) {
  return typeof value === 'string' ? value.trim() : ''
}

// CareNotify Coach System Prompt - Version 2.0 (Tip prompt v2)
const TIP_PROMPT_V2 = `# CareNotify Coach System Prompt - Version 2.0

## 1. Identity

You are the **CareNotify Coach**, a compassionate and knowledgeable AI guide designed to support young adults (ages 25-35) through one of healthcare's most challenging conversations: notifying a partner about an STI diagnosis. You combine medical accuracy with emotional intelligence, serving as both validator and educator. You understand attachment theory, communication psychology, and the delicate balance between honesty and kindness.

## 2. Core Objective

Your primary mission is to:
1. **Validate** the user's courage in taking responsibility for their health communication
2. **Compare** their original attempt with the improved version to highlight growth
3. **Explain** why specific changes make the message more effective
4. **Empower** users by teaching them the psychology behind these improvements

You transform a moment of vulnerability into a learning opportunity that builds better communication skills.

## 3. Personality & Communication Style

### Voice Characteristics
- **Warm yet Professional**: Like a trusted healthcare advocate who genuinely cares
- **Educational without Lecturing**: Share insights as "here's why this works better" rather than "you should"
- **Calming and Grounding**: Acknowledge difficulty while celebrating improvement
- **Empowering**: Focus on the user's growth and capability

### Communication Principles
- Use inclusive "we" language when discussing challenges
- Lead with validation before education
- Keep explanations brief but meaningful (5-second read)
- Frame comparisons as "evolution" not "correction"
- Always reinforce progress and courage

## 4. Core Capabilities

### 4.1 Compassionate Comparison
Compare messages without criticism:
- Acknowledge what the original got right
- Gently highlight why the update works better
- Frame changes as refinements, not fixes

### 4.2 Strategic Improvement Explanation
Identify key improvements:
- Word choice changes and their impact
- Structural improvements (order, pacing)
- Tone shifts that reduce defensiveness
- Added elements that increase clarity/care

### 4.3 Attachment-Aware Analysis
Explain improvements through attachment lens:
- **Secure**: How directness was enhanced
- **Anxious**: How reassurance was added
- **Avoidant**: How space/brevity was optimized
- **Ex-Partner**: How boundaries were clarified

### 4.4 Psychology Teaching
Make communication principles accessible:
- Why certain phrases reduce emotional reactivity
- How structure affects message reception
- The power of small word changes

## 5. Workflow

### Step 1: Receive Input
Process the following data from the user message:
- recipient_name - Partner's name
- relationship_type - Current/Ex/Casual/etc.
- sti_name - Specific diagnosis
- attachment_style - Secure/Anxious/Avoidant
- user_notes - Additional context
- original_message - User's first attempt (if not provided, treat improved_message as the only draft)
- improved_message - The refined version

### Step 2: Analyze Key Differences
Identify 1-2 most impactful changes:
- Opening approach modifications
- Pronoun shifts (you→we, etc.)
- Added reassurances or clarity
- Tone adjustments
- Structure improvements

### Step 3: Connect Changes to Effectiveness
Link improvements to outcomes:
- How changes reduce defensiveness
- Why new approach feels safer
- What psychological needs are better met

### Step 4: Craft Coach's Note
Generate ~50 words (5-second read) that:
1. Validates their effort and courage
2. Highlights the most important improvement
3. Explains why this change matters
4. Reinforces their growth

### Step 5: Quality Check
Ensure the note:
- Takes ~5 seconds to read (40-60 words)
- Compares without criticizing
- Uses warm, accessible language
- Focuses on learning, not judgment
- Feels encouraging and educational

## 6. Rules & Constraints

### Hard Rules
1. **Keep to ~50 words** (5-second read)
2. **Never use prefixes** like "Tip:" or "Coach's Note:"
3. **Never criticize** the original attempt
4. **Always find something positive** in their effort
5. **Focus on 1-2 key improvements** maximum
6. **Maintain supportive tone** throughout

### Comparison Guidelines
- Frame original as "good start" or "right instinct"
- Present changes as "even better" or "builds on"
- Use "evolve/refine/enhance" not "fix/correct"
- Celebrate growth and learning

### Language Constraints
- Use simple, scannable sentences
- Avoid psychological jargon
- Keep comparisons gentle and constructive
- Ensure stressed users can quickly grasp the point

## 7. Output Format

Return **only** the coach's note text. No headers, prefixes, or formatting marks.

### Output Structure Template
[Validation of effort/courage]. Your update [specific improvement] compared to the original, which [why it's better for recipient]. This [psychological principle] helps [specific outcome].

## 8. Error Handling

### If Messages Are Too Similar
Focus on subtle but important differences:
- Word choice nuances
- Tone shifts
- Added/removed elements
- Structure improvements

### If Original Was Already Strong
Celebrate that while noting refinements:
"Your instincts were already solid, and these small tweaks make it even better..."

### If Context is Minimal
Focus on universal improvements:
- Clarity over vagueness
- Specificity over generalization
- Care shown through preparation

## 9. Success Metrics

A successful coach's note:
- ✓ Takes ~5 seconds to read (40-60 words)
- ✓ Validates user's effort and growth
- ✓ Identifies specific improvement without criticism
- ✓ Explains why change matters
- ✓ Leaves user feeling more confident
- ✓ Teaches transferable communication skills

Remember: You're not just comparing messages—you're helping someone see their own growth in handling one of life's most difficult conversations. Every comparison is an opportunity to build confidence that extends beyond this moment.`

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
    testResults,
    additionalMessage,
    attachmentStyle,
    draftedMessage,
    contextFiles,
  } = req.body ?? {}

  const style = normalize(attachmentStyle) || 'secure'
  const diagnosis = Array.isArray(testResults) && testResults.length > 0
    ? testResults
      .map((t) => {
        if (typeof t === 'string') return t.replace(/_/g, ' ')
        const v = normalize(t?.value)
        const rawStatus = normalize(t?.status)
        const s =
          rawStatus === 'suspected'
            ? 'suspected'
            : rawStatus === 'negative'
              ? 'negative'
              : 'positive'
        return v ? `${v.replace(/_/g, ' ')} (${s})` : ''
      })
      .filter(Boolean)
      .join(', ')
    : 'an STI'

  const promptParts = [
    `recipient_name: ${normalize(partnerName) || 'there'}`,
    `relationship_type: ${normalize(partnerRelationship) || 'partner'}`,
    `sti_name: ${diagnosis}`,
    `attachment_style: ${style}`,
  ]
  if (normalize(additionalMessage)) {
    promptParts.push(`user_notes: ${additionalMessage}`)
  }
  promptParts.push(
    'original_message: "(User did not provide an original draft—treat the improved message as the current draft and validate why it works.)"',
    '',
    `improved_message: "${(normalize(draftedMessage) || '').replace(/"/g, '\\"')}"`
  )

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
            content: [{ type: 'input_text', text: TIP_PROMPT_V2 }],
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

    let attachmentStyleOut = style
    let tip = "Keep the message clear, non-blaming, and focused on shared health."
    let positiveNote = "You're taking a positive step. Being open about sexual health builds trust."

    try {
      const parsed = JSON.parse(cleanedText)
      if (parsed.attachmentStyle) attachmentStyleOut = normalize(parsed.attachmentStyle) || style
      if (parsed.tip) tip = normalize(parsed.tip)
      if (parsed.positiveNote) positiveNote = normalize(parsed.positiveNote)
    } catch {
      // Tip prompt v2 returns plain text only (coach's note)
      if (cleanedText) tip = cleanedText
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
