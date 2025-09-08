import { Card, Rank, Suit } from './types'
import { shuffle, mulberry32 } from './util'

const ranks: Rank[] = ['6','7','8','9','T','J','Q','K','A']
const suits: Suit[] = ['C','D','H','S']

export function makeDeck(rngSeed: number): Card[] {
  const rng = mulberry32(rngSeed)
  const deck: Card[] = []
  for (const s of suits) {
    for (const r of ranks) {
      const id = `${r}${s}-${Math.floor(rng()*1e9)}`
      deck.push({ suit: s, rank: r, id })
    }
  }
  // Mark 6S and 6C as Jokers (Georgian variant by default)
  deck.forEach(c => {
    if (c.rank === '6' && (c.suit === 'S' || c.suit === 'C')) c.isJoker = true
  })
  shuffle(deck, rng)
  return deck
}

export function cardAssetFile(c: Card): string {
  const r = c.rank === 'T' ? 'T' : c.rank
  return `${r}${c.suit}.svg`
}
