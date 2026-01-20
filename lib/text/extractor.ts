/**
 * Text extraction utilities
 */

import { TelegramMessage } from '../telegram/types'
import { extractTextFromTelegramUrl } from '../telegram/api'

/**
 * Check if string is a Telegram URL
 * @param {string} text - Text to check [in]
 * @returns {boolean} - True if text is Telegram URL [out]
 */
export function isTelegramUrl(text: string): boolean
{
  return /^https?:\/\/(www\.)?t\.me\/.+/.test(text) || /^t\.me\/.+/.test(text)
}

/**
 * Extract text from message or Telegram post
 * @param {string} messageText - Message text or URL [in]
 * @param {TelegramMessage} message - Full message object [in]
 * @returns {Promise<string>} - Extracted text [out]
 */
export async function extractText(
  messageText: string | undefined,
  message?: TelegramMessage
): Promise<string>
{
  if (!messageText && !message)
  {
    throw new Error('No text or message provided')
  }

  if (!messageText && message?.caption)
  {
    messageText = message.caption
  }

  if (!messageText)
  {
    throw new Error('No text found in message')
  }

  if (isTelegramUrl(messageText))
  {
    try
    {
      return await extractTextFromTelegramUrl(messageText)
    }
    catch (error)
    {
      console.warn('Failed to extract text from Telegram URL:', error)
      return messageText
    }
  }

  return messageText
}

/**
 * Validate input data
 * @param {string} text - Text to validate [in]
 * @returns {boolean} - True if valid [out]
 */
export function validateInput(text: string): boolean
{
  return text.trim().length > 0
}
