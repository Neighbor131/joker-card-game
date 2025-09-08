import { Card, PlayerId, Suit, Trick } from './types'

const RANK_WEIGHT: Record<string, number> = {
  'A': 9, 'K': 8, 'Q': 7, 'J': 6, 'T': 5, '9': 4, '8': 3, '7': 2, '6': 1
}

export function compareCards(a: Card, b: Card, leadSuit: Suit | null, trump: Suit | null, jokerLowest: boolean): number {
  // return >0 if a > b
  // Jokers override
  const aJ = !!a.isJoker
  const bJ = !!b.isJoker
  if (!jokerLowest) {
    if (aJ && bJ) return 1 // later Joker wins; tie-breaking handled by play order
    if (aJ) return 1
    if (bJ) return -1
  } else {
    // Joker treated as lowest
    if (aJ && bJ) return 0
    if (aJ) return -1
    if (bJ) return 1
  }
  // trump beats others
  if (trump) {
    const aT = a.suit === trump
    const bT = b.suit === trump
    if (aT && !bT) return 1
    if (!aT && bT) return -1
    if (aT && bT) return RANK_WEIGHT[a.rank] - RANK_WEIGHT[b.rank]
  }
  // same suit as lead
  if (leadSuit) {
    const aL = a.suit === leadSuit
    const bL = b.suit === leadSuit
    if (aL && !bL) return 1
    if (!aL && bL) return -1
    if (aL && bL) return RANK_WEIGHT[a.rank] - RANK_WEIGHT[b.rank]
  }
  // otherwise compare by raw rank (but won't win over lead/trump)
  return RANK_WEIGHT[a.rank] - RANK_WEIGHT[b.rank]
}

export function resolveWinner(trick: Trick, trump: Suit | null, jokerLowest: boolean): PlayerId {
  // Determine leadSuit. If leader played Joker and declared suit, use that.
  let leadSuit: Suit | null = null
  const leadPlay = trick.plays[0]
  if (leadPlay.card.isJoker) {
    leadSuit = leadPlay.declaredSuit ?? null
  } else {
    leadSuit = leadPlay.card.suit
  }
  let bestIdx = 0
  for (let i=1;i<trick.plays.length;i++){
    const a = trick.plays[bestIdx].card
    const b = trick.plays[i].card
    const cmp = compareCards(a,b,leadSuit,trump,jokerLowest)
    if (cmp < 0) bestIdx = i
    // If both are Jokers and equal, later Joker wins by rule; the logic above already gives later Joker precedence
  }
  return trick.plays[bestIdx].player as PlayerId
}
