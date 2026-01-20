/**
 * Telegram API types
 */

export interface TelegramUpdate
{
  update_id: number
  message?: TelegramMessage
}

export interface TelegramMessage
{
  message_id: number
  chat: TelegramChat
  text?: string
  caption?: string
  entities?: TelegramMessageEntity[]
  forward_from?: TelegramUser
  forward_from_chat?: TelegramChat
  forward_from_message_id?: number
}

export interface TelegramChat
{
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
}

export interface TelegramUser
{
  id: number
  is_bot: boolean
  first_name: string
  username?: string
}

export interface TelegramMessageEntity
{
  type: string
  offset: number
  length: number
  url?: string
}
