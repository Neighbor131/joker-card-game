import { Card, PlayerId, Suit, Trick } from './types'

const RANK_WEIGHT: Record<string, number> = {
  'A': 9, 'K': 8, 'Q': 7, 'J': 6, 'T': 5, '9': 4, '8': 3, '7': 2, '6': 1
}

export function compareCards(
  a: Card, 
  b: Card, 
  leadSuit: Suit | null, 
  trump: Suit | null, 
  jokerHighA: boolean,
  jokerHighB: boolean,
  playOrderA: number,
  playOrderB: number
): number {
  // return >0 if a > b
  
  const aJ = !!a.isJoker
  const bJ = !!b.isJoker
  
  // Handle Joker vs Joker
  if (aJ && bJ) {
    if (jokerHighA && jokerHighB) {
      // Both high: later one wins (higher play order)
      return playOrderA > playOrderB ? 1 : -1
    }
    if (jokerHighA && !jokerHighB) return 1 // High beats low
    if (!jokerHighA && jokerHighB) return -1 // Low loses to high
    // Both low: compare play order (shouldn't happen often)
    return playOrderA > playOrderB ? 1 : -1
  }
  
  // Joker vs regular card
  if (aJ) {
    if (jokerHighA) {
      // High Joker beats everything except:
      // - If Joker led specifying non-trump suit and b is trump
      if (leadSuit && leadSuit !== trump && b.suit === trump) {
        return -1 // Trump beats high Joker when Joker led non-trump
      }
      return 1 // High Joker wins
    } else {
      return -1 // Low Joker loses to regular cards
    }
  }
  
  if (bJ) {
    if (jokerHighB) {
      // High Joker beats everything except trump over non-trump lead
      if (leadSuit && leadSuit !== trump && a.suit === trump) {
        return 1 // Trump beats high Joker when Joker led non-trump
      }
      return -1 // High Joker wins
    } else {
      return 1 // Regular card beats low Joker
    }
  }
  
  // Regular card vs regular card
  // Trump beats non-trump
  if (trump) {
    const aT = a.suit === trump
    const bT = b.suit === trump
    if (aT && !bT) return 1
    if (!aT && bT) return -1
    if (aT && bT) return RANK_WEIGHT[a.rank] - RANK_WEIGHT[b.rank]
  }
  
  // Follow suit rules
  if (leadSuit) {
    const aL = a.suit === leadSuit
    const bL = b.suit === leadSuit
    if (aL && !bL) return 1
    if (!aL && bL) return -1
    if (aL && bL) return RANK_WEIGHT[a.rank] - RANK_WEIGHT[b.rank]
  }
  
  // Otherwise compare by rank
  return RANK_WEIGHT[a.rank] - RANK_WEIGHT[b.rank]
}

export function resolveWinner(trick: Trick, trump: Suit | null): PlayerId {
  // Determine leadSuit from the first play
  let leadSuit: Suit | null = null
  const leadPlay = trick.plays[0]
  
  if (leadPlay.card.isJoker) {
    leadSuit = trick.declaredLeadSuit ?? null
  } else {
    leadSuit = leadPlay.card.suit
  }
  
  let bestIdx = 0
  
  for (let i = 1; i < trick.plays.length; i++) {
    const bestPlay = trick.plays[bestIdx]
    const currentPlay = trick.plays[i]
    
    // Determine if Jokers are high or low (this would come from play decision in real game)
    // For now, assume all Jokers are played high unless specified otherwise
    const jokerHighBest = bestPlay.card.isJoker ? (bestPlay.jokerHigh ?? true) : false
    const jokerHighCurrent = currentPlay.card.isJoker ? (currentPlay.jokerHigh ?? true) : false
    
    const cmp = compareCards(
      bestPlay.card, 
      currentPlay.card, 
      leadSuit, 
      trump,
      jokerHighBest,
      jokerHighCurrent,
      bestIdx, // play order
      i // play order
    )
    
    if (cmp < 0) bestIdx = i
  }
  
  return trick.plays[bestIdx].player as PlayerId
}
