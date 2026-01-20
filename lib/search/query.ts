/**
 * Search query formation utilities
 */

import { ExtractedEntities } from '../parser/entities'

/**
 * Form search query from extracted entities
 * @param {ExtractedEntities} entities - Extracted entities
 * @returns {string} - Search query
 */
export function formSearchQuery(entities: ExtractedEntities): string
{
  const queryParts: string[] = []
  
  // Add key claims (first 2-3)
  if (entities.claims.length > 0)
  {
    // Extract key words from claims
    const claimWords = entities.claims.slice(0, 2)
      .flatMap(claim => claim.split(/\s+/))
      .filter(word => word.length > 3) // Filter short words
      .slice(0, 5) // Limit to 5 words
    
    queryParts.push(...claimWords)
  }
  
  // Add names
  if (entities.names.length > 0)
  {
    queryParts.push(...entities.names.slice(0, 3))
  }
  
  // Add dates (most recent)
  if (entities.dates.length > 0)
  {
    queryParts.push(entities.dates[0])
  }
  
  // Add numbers (largest/significant)
  if (entities.numbers.length > 0)
  {
    const significantNumbers = entities.numbers
      .filter(n => n > 10) // Filter small numbers
      .slice(0, 2)
    
    queryParts.push(...significantNumbers.map(n => n.toString()))
  }
  
  // Combine and limit length
  const query = queryParts.join(' ').trim()
  
  // Limit query length (Google Search API limit is ~2048 characters)
  return query.length > 200 ? query.substring(0, 200) : query
}

/**
 * Form multiple search queries for different source types
 * @param {ExtractedEntities} entities - Extracted entities
 * @returns {Record<string, string>} - Queries for different source types
 */
export function formQueriesBySourceType(entities: ExtractedEntities): Record<string, string>
{
  const baseQuery = formSearchQuery(entities)
  
  return {
    official: `${baseQuery} site:gov.ru OR site:org OR site:official`,
    news: `${baseQuery} site:news OR site:rbc.ru OR site:ria.ru OR site:tass.ru OR site:interfax.ru`,
    blogs: `${baseQuery} site:medium.com OR site:habr.com OR site:blog`,
    research: `${baseQuery} site:edu OR site:academic OR site:research OR site:scholar`,
  }
}
