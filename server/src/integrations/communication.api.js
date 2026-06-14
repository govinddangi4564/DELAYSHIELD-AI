/**
 * communication.api.js
 * Simulated External Communication APIs for DelayShield AI.
 * Simulates WhatsApp, SMS, Email, and System Alert integrations.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Simulates sending an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Promise<{ success: boolean, status: string, error?: string }>}
 */
export async function sendEmail(to, subject, body) {
  console.log(`[Email API] Sending to: ${to}\nSubject: ${subject}\nBody: ${body.substring(0, 100)}...\n---`)
  await sleep(600)
  
  // 96% success rate for realism
  const success = Math.random() > 0.04
  return {
    success,
    status: success ? 'Delivered' : 'Failed',
    error: success ? null : 'SMTP Connection Timeout'
  }
}

/**
 * Simulates sending an SMS
 * @param {string} phone - Recipient phone number
 * @param {string} message - SMS body
 * @returns {Promise<{ success: boolean, status: string, error?: string }>}
 */
export async function sendSMS(phone, message) {
  console.log(`[SMS API] Sending to: ${phone}\nMessage: ${message.substring(0, 100)}...\n---`)
  await sleep(400)
  
  const success = Math.random() > 0.04
  return {
    success,
    status: success ? 'Delivered' : 'Failed',
    error: success ? null : 'SMS Gateway Network congestion'
  }
}

/**
 * Simulates sending a WhatsApp message
 * @param {string} phone - Recipient phone number
 * @param {string} message - WhatsApp body
 * @returns {Promise<{ success: boolean, status: string, error?: string }>}
 */
export async function sendWhatsApp(phone, message) {
  console.log(`[WhatsApp API] Sending to: ${phone}\nMessage: ${message.substring(0, 100)}...\n---`)
  await sleep(500)
  
  const success = Math.random() > 0.03
  return {
    success,
    status: success ? 'Delivered' : 'Failed',
    error: success ? null : 'WhatsApp Business account rate limit'
  }
}

/**
 * Simulates a Push Notification / System Alert
 * @param {string} target - Target channel or system node
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @returns {Promise<{ success: boolean, status: string, error?: string }>}
 */
export async function sendSystemAlert(target, title, message) {
  console.log(`[System Alert] Triggered for: ${target}\nTitle: ${title}\nMessage: ${message.substring(0, 100)}...\n---`)
  await sleep(200)
  
  return {
    success: true,
    status: 'Delivered',
    error: null
  }
}
