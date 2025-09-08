import { Bid, Card, PlayerId, Suit } from './types'

const RVAL: Record<string, number> = { 'A':1.0,'K':0.8,'Q':0.6,'J':0.5,'T':0.4,'9':0.3,'8':0.2,'7':0.12,'6':0.06 }

function evaluateHand(cards: Card[], trump: Suit|null): number {
  // crude expected tricks estimator
  let score = 0
  for (const c of cards) {
    if (c.isJoker) score += 0.9
    else if (trump && c.suit === trump) score += RVAL[c.rank]*1.2
    else score += RVAL[c.rank]*0.8
  }
  return score
}

export function aiPickTrump(afterDealer: PlayerId, hands: Record<PlayerId, Card[]>): Suit | null {
  // choose suit with max high-card density; or no-trump if hand is balanced
  const me = afterDealer
  const h = hands[me]
  const counts: Record<Suit, number> = {C:0,D:0,H:0,S:0}
  for (const c of h) {
    if (!c.isJoker) counts[c.suit] += RVAL[c.rank]
  }
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]) as [Suit,number][]
  const best = entries[0]
  const second = entries[1]
  if ((best[1] - second[1]) < 0.3) return null // no-trump if close
  return best[0]
}

export function aiBid(player: PlayerId, hand: Card[], trump: Suit | null, maxBid: number): Bid {
  const est = evaluateHand(hand, trump)
  let v = Math.max(0, Math.min(maxBid, Math.round(est)))
  if (v===0) return { type:'pass'}
  return { type:'number', value: v }
}

export function aiPlay(player: PlayerId, hand: Card[], leadSuit: Suit|null, trump: Suit|null, mustFollow: boolean, needToWin: boolean): Card {
  // simple policy: follow suit lowest that wins if needToWin, else lowest
  const playable = hand.filter(c => {
    if (!mustFollow) return true
    if (!leadSuit) return true
    const hasLead = hand.some(x => !x.isJoker && x.suit === leadSuit)
    if (hasLead) return c.isJoker ? false : c.suit === leadSuit
    return true
  })
  // prefer non-jokers unless needToWin
  const sorted = playable.slice().sort((a,b)=>rankScore(a) - rankScore(b))
  if (needToWin) return sorted[sorted.length-1]
  return sorted[0]
}

function rankScore(c: Card): number {
  const W: Record<string, number> = {'A':9,'K':8,'Q':7,'J':6,'T':5,'9':4,'8':3,'7':2,'6':1}
  return (c.isJoker? 100:0) + (W[c.rank]||0)
}
