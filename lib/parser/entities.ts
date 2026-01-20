/**
 * Entity extraction from text
 */

export interface ExtractedEntities
{
  claims: string[]
  dates: string[]
  numbers: number[]
  names: string[]
  links: string[]
}

/**
 * Extract dates from text (various formats)
 * @param {string} text - Input text
 * @returns {string[]} - Array of found dates
 */
export function extractDates(text: string): string[]
{
  const dates: string[] = []
  
  // DD.MM.YYYY or DD/MM/YYYY
  const datePattern1 = /\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\b/g
  // YYYY-MM-DD
  const datePattern2 = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g
  // Relative dates: "сегодня", "вчера", "неделю назад", etc.
  const relativePattern = /\b(сегодня|вчера|позавчера|неделю назад|месяц назад|год назад)\b/gi
  // Month names: "января 2024", "15 января"
  const monthPattern = /\b(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})?\b/gi

  let match
  
  // Extract DD.MM.YYYY or DD/MM/YYYY
  while ((match = datePattern1.exec(text)) !== null)
  {
    dates.push(match[0])
  }
  
  // Extract YYYY-MM-DD
  while ((match = datePattern2.exec(text)) !== null)
  {
    dates.push(match[0])
  }
  
  // Extract relative dates
  while ((match = relativePattern.exec(text)) !== null)
  {
    dates.push(match[0])
  }
  
  // Extract month names
  while ((match = monthPattern.exec(text)) !== null)
  {
    dates.push(match[0])
  }

  return [...new Set(dates)] // Remove duplicates
}

/**
 * Extract numbers from text (statistics, percentages, amounts)
 * @param {string} text - Input text
 * @returns {number[]} - Array of found numbers
 */
export function extractNumbers(text: string): number[]
{
  const numbers: number[] = []
  
  // Percentages: "50%", "50 процентов"
  const percentPattern = /\b(\d+(?:[.,]\d+)?)\s*%/g
  // Large numbers with separators: "1,000", "1.000"
  const numberPattern = /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)\b/g
  // Numbers with words: "миллион", "тысяча"
  const wordNumberPattern = /\b(\d+)\s*(тысяч|миллион|миллиард|млн|млрд)\b/gi

  let match: RegExpExecArray | null
  
  // Extract percentages
  while ((match = percentPattern.exec(text)) !== null)
  {
    if (match && match[1])
    {
      const num = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(num))
      {
        numbers.push(num)
      }
    }
  }
  
  // Extract regular numbers
  while ((match = numberPattern.exec(text)) !== null)
  {
    if (match && match[1])
    {
      const matchValue = match[1]
      const num = parseFloat(matchValue.replace(/[.,]/g, (m, offset) => offset < matchValue.length - 3 ? '' : '.'))
      if (!isNaN(num) && num > 0)
      {
        numbers.push(num)
      }
    }
  }
  
  // Extract word numbers (simplified - just extract the digit part)
  while ((match = wordNumberPattern.exec(text)) !== null)
  {
    if (match && match[1])
    {
      const num = parseFloat(match[1])
      if (!isNaN(num))
      {
        numbers.push(num)
      }
    }
  }

  return [...new Set(numbers)] // Remove duplicates
}

/**
 * Extract URLs from text
 * @param {string} text - Input text
 * @returns {string[]} - Array of found URLs
 */
export function extractLinks(text: string): string[]
{
  const urlPattern = /https?:\/\/[^\s]+/g
  const links: string[] = []
  let match: RegExpExecArray | null
  
  while ((match = urlPattern.exec(text)) !== null)
  {
    if (match && match[0])
    {
      links.push(match[0])
    }
  }

  return [...new Set(links)] // Remove duplicates
}

/**
 * Extract key claims/statements from text
 * Simple heuristic: sentences with facts, numbers, or specific patterns
 * @param {string} text - Input text
 * @returns {string[]} - Array of key claims
 */
export function extractClaims(text: string): string[]
{
  const claims: string[] = []
  
  // Split into sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)
  
  // Look for sentences with indicators of factual claims
  const claimIndicators = [
    /\b(составляет|равно|достиг|составил|увеличился|уменьшился|вырос|упал)\b/i,
    /\b(по данным|согласно|по информации|источник|сообщает|заявил)\b/i,
    /\d+/, // Contains numbers
    /\b(процент|процентов|%)\b/i,
  ]
  
  for (const sentence of sentences)
  {
    // Check if sentence contains claim indicators
    const hasClaim = claimIndicators.some(pattern => pattern.test(sentence))
    
    if (hasClaim && sentence.length > 20) // Minimum length to avoid noise
    {
      claims.push(sentence)
    }
  }
  
  return claims.slice(0, 10) // Limit to top 10 claims
}

/**
 * Extract names (people, organizations, places) from text
 * Simple heuristic based on capitalization and common patterns
 * @param {string} text - Input text
 * @returns {string[]} - Array of found names
 */
export function extractNames(text: string): string[]
{
  const names: string[] = []
  
  // Capitalized words (potential names)
  // Pattern: Capital letter followed by lowercase letters
  const capitalizedPattern = /\b([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)*)\b/g
  
  // Common organization suffixes
  const orgPattern = /\b([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)*)\s+(ООО|ЗАО|ОАО|ПАО|Inc|Ltd|Corp|LLC)\b/gi
  
  // Geographic names (cities, countries)
  const geoPattern = /\b(Москва|Санкт-Петербург|Россия|США|Европа|Азия|Африка|Америка)\b/gi
  
  let match: RegExpExecArray | null
  
  // Extract capitalized names
  while ((match = capitalizedPattern.exec(text)) !== null)
  {
    const name = match[1]
    // Filter out common words that start with capital letter
    const commonWords = ['Россия', 'России', 'Россию', 'Москва', 'Москве', 'Москву']
    if (!commonWords.includes(name) && name.length > 2)
    {
      names.push(name)
    }
  }
  
  // Extract organizations
  while ((match = orgPattern.exec(text)) !== null)
  {
    names.push(match[0])
  }
  
  // Extract geographic names
  while ((match = geoPattern.exec(text)) !== null)
  {
    names.push(match[0])
  }

  return [...new Set(names)] // Remove duplicates
}

/**
 * Extract all entities from text
 * @param {string} text - Input text
 * @returns {ExtractedEntities} - All extracted entities
 */
export function extractEntities(text: string): ExtractedEntities
{
  return {
    claims: extractClaims(text),
    dates: extractDates(text),
    numbers: extractNumbers(text),
    names: extractNames(text),
    links: extractLinks(text),
  }
}

/**
 * Normalize extracted entities
 * @param {ExtractedEntities} entities - Raw entities
 * @returns {ExtractedEntities} - Normalized entities
 */
export function normalizeEntities(entities: ExtractedEntities): ExtractedEntities
{
  // Normalize dates (convert to ISO format where possible)
  const normalizedDates = entities.dates.map(date =>
  {
    // Try to parse and normalize common formats
    // For now, just trim whitespace
    return date.trim()
  })
  
  // Normalize names (trim, remove extra spaces)
  const normalizedNames = entities.names.map(name =>
  {
    return name.trim().replace(/\s+/g, ' ')
  })
  
  // Normalize links (remove trailing punctuation)
  const normalizedLinks = entities.links.map(link =>
  {
    return link.replace(/[.,;:!?]+$/, '')
  })

  return {
    claims: entities.claims.map(c => c.trim()),
    dates: normalizedDates,
    numbers: entities.numbers,
    names: normalizedNames,
    links: normalizedLinks,
  }
}
