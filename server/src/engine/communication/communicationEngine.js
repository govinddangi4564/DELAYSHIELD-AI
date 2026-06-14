import dotenv from 'dotenv'
import { generateContentWithModelFallback } from '../decision/geminiModel.js'
import { CommunicationTemplate } from '../../models/communicationTemplate.model.js'
import { CommunicationLog } from '../../models/communicationLog.model.js'
import { sendEmail, sendSMS, sendWhatsApp, sendSystemAlert } from '../../integrations/communication.api.js'

dotenv.config()
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * Seed default templates if they do not exist.
 */
export async function seedDefaultTemplates() {
  try {
    const defaults = [
      {
        id: 'Driver_Delay_Risk',
        stakeholderType: 'Driver',
        eventType: 'Delay Risk',
        channel: 'SMS',
        subject: 'Delay Risk Alert — {{shipmentId}}',
        body: 'Traffic congestion detected ahead. Recommended Route: {{alternative}}. Estimated Time Saving: {{timeSaving}} minutes.'
      },
      {
        id: 'Driver_Route_Change',
        stakeholderType: 'Driver',
        eventType: 'Route Change',
        channel: 'Push Notification',
        subject: 'Route Change Protocol — {{shipmentId}}',
        body: 'Route change detected. Please reroute via {{alternative}} to save {{timeSaving}} minutes. Reason: {{reason}}.'
      },
      {
        id: 'Warehouse_Delay_Risk',
        stakeholderType: 'Warehouse',
        eventType: 'Delay Risk',
        channel: 'System Alert',
        subject: 'Inbound Shipment Delayed — {{shipmentId}}',
        body: 'Shipment {{shipmentId}} is expected to arrive {{delay}} minutes late. Please adjust unloading schedules and dock allocations accordingly.'
      },
      {
        id: 'Warehouse_Warehouse_Change',
        stakeholderType: 'Warehouse',
        eventType: 'Warehouse Change',
        channel: 'System Alert',
        subject: 'Dock/Warehouse Shift — {{shipmentId}}',
        body: 'Facility update: Shipment {{shipmentId}} redirected to Dock {{alternative}} due to operational constraints.'
      },
      {
        id: 'Customer_Delay_Risk',
        stakeholderType: 'Customer',
        eventType: 'Delay Risk',
        channel: 'Email',
        subject: 'Logistics Update: Delay Notification for {{shipmentId}}',
        body: 'Dear Customer, Your shipment {{shipmentId}} has been delayed due to {{reason}}. Updated ETA: {{updatedEta}}. Thank you for your patience.'
      },
      {
        id: 'Customer_Updated_ETA',
        stakeholderType: 'Customer',
        eventType: 'Updated ETA',
        channel: 'Email + SMS',
        subject: 'Updated ETA for Shipment {{shipmentId}}',
        body: 'Dear Customer, we have updated your shipment {{shipmentId}} delivery time. Revised ETA: {{updatedEta}} (Delay: {{delay}} min). Thank you for choosing DelayShield.'
      }
    ]

    for (const t of defaults) {
      await CommunicationTemplate.findOneAndUpdate(
        { id: t.id },
        t,
        { upsert: true, new: true }
      )
    }
    console.log('[communicationEngine] Communication templates seeded successfully.')
  } catch (e) {
    console.error('[communicationEngine] Failed to seed communication templates:', e.message)
  }
}

/**
 * Fallback template variable replacement.
 */
export function parseTemplate(templateText, { shipment, customContext }) {
  let result = templateText
  const replacements = {
    shipmentId: shipment.id || 'SHP-XXXX',
    delay: shipment.delay || '90',
    origin: shipment.origin?.name || 'Origin',
    destination: shipment.destination?.name || 'Destination',
    reason: customContext?.reason || 'Traffic Congestion',
    alternative: customContext?.alternative || 'NH48',
    timeSaving: customContext?.timeSaving || '35',
    updatedEta: shipment.etas?.updated || customContext?.updatedEta || '7:30 PM',
    originalEta: shipment.etas?.original || customContext?.originalEta || '6:00 PM'
  }

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
    result = result.replace(regex, value)
  }
  return result
}

/**
 * Generate communication subject and body, personalized with Gemini if active, or via parsed templates.
 */
export async function generateNotificationContent({
  shipment,
  eventType,
  stakeholderType,
  template,
  customContext = {}
}) {
  const useGemini = process.env.AI_PROVIDER === 'gemini' && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'

  if (useGemini) {
    try {
      const prompt = `You are the DelayShield AI Communication Assistant.
Generate a personalized, clear notification message (subject and body) for a specific stakeholder (${stakeholderType}) about a shipment event.

Shipment Details:
- ID: ${shipment.id}
- Origin: ${shipment.origin?.name || 'N/A'}
- Destination: ${shipment.destination?.name || 'N/A'}
- Current Status: ${shipment.status || 'In Transit'}
- Predicted Delay: ${shipment.delay || 0} minutes
- ETA: Original: ${shipment.etas?.original || 'N/A'}, Updated: ${shipment.etas?.updated || 'N/A'}
- Risk Factors: Traffic: ${shipment.traffic || 0}%, Weather: ${shipment.weather || 0}%
- Context Reason: ${customContext.reason || 'Traffic Congestion'}
- Recommended Action/Alternative: ${customContext.alternative || 'NH48'}
- Time Saving: ${customContext.timeSaving || '35'} minutes

Stakeholder Role: ${stakeholderType}
Notification Event Type: ${eventType}

Standard Template Subject reference: ${template.subject}
Standard Template Body reference: ${template.body}

Guidelines:
1. Driver: Tone must be direct, clear, safety-oriented, and highly actionable. Include the recommended route (${customContext.alternative || 'NH48'}) and time savings.
2. Warehouse Manager: Tone must be planning-oriented and professional. Give concrete delay figures (${shipment.delay} minutes) and instructions to adjust unloading/dock scheduling.
3. Customer: Tone must be highly professional, polite, reassuring, and empathetic. Apologize for delay, explain cause, list updated ETA (${shipment.etas?.updated || '7:30 PM'}), and thank them for patience.

Return ONLY a valid JSON block. No markdown backticks, no explanations.
Exact JSON shape:
{
  "subject": "tailored subject text",
  "body": "tailored body text"
}
`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const { result } = await generateContentWithModelFallback({
        apiKey: GEMINI_API_KEY,
        prompt,
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const rawText = result.response.text()
      const jsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1)
      const parsed = JSON.parse(jsonStr)
      if (parsed.subject && parsed.body) {
        return {
          subject: parsed.subject,
          body: parsed.body,
          personalized: true
        }
      }
    } catch (e) {
      console.warn('[communicationEngine] Gemini generation failed, falling back to static templates:', e.message)
    }
  }

  // Fallback to static template parser
  return {
    subject: parseTemplate(template.subject, { shipment, customContext }),
    body: parseTemplate(template.body, { shipment, customContext }),
    personalized: false
  }
}

/**
 * Triggers notification sending and logging for a single stakeholder.
 */
export async function sendStakeholderNotification({
  shipment,
  eventType,
  stakeholderType,
  customContext = {}
}) {
  // 1. Fetch template or use default
  let template = await CommunicationTemplate.findOne({ stakeholderType, eventType }).lean()
  if (!template) {
    // Attempt to fallback to Delay Risk if specific event doesn't exist
    template = await CommunicationTemplate.findOne({ stakeholderType, eventType: 'Delay Risk' }).lean()
  }

  // If still no template, construct a generic default
  if (!template) {
    template = {
      subject: `Alert: ${eventType} for ${shipment.id}`,
      body: `Notification regarding shipment {{shipmentId}}. Status: {{reason}}. Delay: {{delay}} min.`,
      channel: stakeholderType === 'Driver' ? 'SMS' : stakeholderType === 'Customer' ? 'Email' : 'System Alert'
    }
  }

  // 2. Generate content (Personalized or Fallback)
  const { subject, body, personalized } = await generateNotificationContent({
    shipment,
    eventType,
    stakeholderType,
    template,
    customContext
  })

  // 3. Determine recipient details
  let recipient = ''
  if (stakeholderType === 'Driver') {
    recipient = customContext.driverPhone || `Driver D-${shipment.id.split('-')[1] || '1247'} (+91 98765 01247)`
  } else if (stakeholderType === 'Warehouse') {
    recipient = customContext.warehouseEmail || `${shipment.destination?.name ? 'WH-' + shipment.destination.name.split(',')[0].replace(/\s+/g, '-') : 'WH-Chennai-2'}`
  } else {
    recipient = customContext.customerEmail || `Reliance Industries`
  }

  // 4. Send via integration mock APIs
  let apiResult
  const channel = template.channel
  try {
    if (channel.includes('Email')) {
      apiResult = await sendEmail(recipient, subject, body)
    } else if (channel.includes('SMS')) {
      apiResult = await sendSMS(recipient, body)
    } else if (channel.includes('WhatsApp')) {
      apiResult = await sendWhatsApp(recipient, body)
    } else {
      apiResult = await sendSystemAlert(recipient, subject, body)
    }
  } catch (err) {
    apiResult = { success: false, status: 'Failed', error: err.message }
  }

  // 5. Save communication log
  const log = await CommunicationLog.create({
    shipmentId: shipment.id,
    stakeholderType,
    eventType,
    recipient,
    channel,
    subject,
    body: personalized ? `[AI] ${body}` : body,
    status: apiResult.status,
    error: apiResult.error
  })

  return log
}

/**
 * Triggers notifications to ALL stakeholders for a given shipment and event.
 */
export async function triggerAllStakeholderNotifications(shipment, eventType, customContext = {}) {
  const stakeholders = ['Driver', 'Warehouse', 'Customer']
  const results = []

  for (const stakeholderType of stakeholders) {
    try {
      const log = await sendStakeholderNotification({
        shipment,
        eventType,
        stakeholderType,
        customContext
      })
      results.push(log)
    } catch (e) {
      console.error(`[communicationEngine] Error notifying ${stakeholderType}:`, e.message)
    }
  }

  return results
}
