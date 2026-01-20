/**
 * Text extraction utilities
 */

import { TelegramMessage } from '../telegram/types'
import { extractTextFromTelegramUrl } from '../telegram/api'

/**
 * Check if string is a Telegram URL
 * @param {string} text - Text to check
 * @returns {boolean} - True if text is Telegram URL
 */
export function isTelegramUrl(text: string): boolean
{
  return /^https?:\/\/(www\.)?t\.me\/.+/.test(text) || /^t\.me\/.+/.test(text)
}

/**
 * Extract text from message or Telegram post
 * @param {string} messageText - Message text or URL
 * @param {TelegramMessage} message - Full message object
 * @returns {Promise<string>} - Extracted text
 */
export async function extractText(
  messageText: string | undefined,
  message?: TelegramMessage
): Promise<string>
{
  // Handle empty message
  if (!messageText && !message)
  {
    throw new Error('No text or message provided')
  }

  // Handle caption for media messages
  if (!messageText && message?.caption)
  {
    messageText = message.caption
  }

  if (!messageText)
  {
    throw new Error('No text found in message')
  }

  // Check if it's a Telegram URL
  if (isTelegramUrl(messageText))
  {
    try
    {
      return await extractTextFromTelegramUrl(messageText)
    }
    catch (error)
    {
      // If extraction fails, return original text
      console.warn('Failed to extract text from Telegram URL:', error)
      return messageText
    }
  }

  // Handle forwarded messages
  if (message?.forward_from_message_id && message?.forward_from_chat)
  {
    // Note: Would need to fetch forwarded message content
    // For now, return current text
  }

  return messageText
}

/**
 * Validate input data
 * @param {string} text - Text to validate
 * @returns {boolean} - True if valid
 */
export function validateInput(text: string): boolean
{
  return text.trim().length > 0
}
