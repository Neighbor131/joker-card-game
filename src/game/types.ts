export type Suit = 'C'|'D'|'H'|'S'
export type Rank = '6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'

export interface Card {
  suit: Suit
  rank: Rank
  isJoker?: boolean
  id: string // unique id per deal
}

export type PlayerId = 0|1|2|3 // 0=You

export interface Trick {
  leader: PlayerId
  plays: { player: PlayerId, card: Card, declaredSuit?: Suit }[]
  winner?: PlayerId
  declaredLeadSuit?: Suit // used when leader plays Joker and calls a suit
}

export interface DealContext {
  dealer: PlayerId
  handSize: number
  phase: number // 1..4
  trump: Suit | null // null means no-trump
  jokerLowest: boolean
  trumpDecider?: PlayerId // only for 9-card deals: player after dealer
}

export type Bid = { type: 'pass' } | { type:'number', value: number }

export interface DealResult {
  bids: Record<PlayerId, Bid>
  taken: Record<PlayerId, number>
  scores: Record<PlayerId, number>
  khishtApplied: Record<PlayerId, boolean>
  trump: Suit | null
}

export interface GameState {
  rngSeed: number
  players: string[]
  dealer: PlayerId
  phase: number
  handSize: number
  trump: Suit | null
  jokerLowest: boolean
  trumpDecider?: PlayerId
  hands: Record<PlayerId, Card[]>
  trick?: Trick
  table: (Card | null)[]
  bids: Partial<Record<PlayerId, Bid>>
  taken: Record<PlayerId, number>
  scores: number[]
  history: DealResult[]
  awaiting: 'bidding'|'trump-pick'|'play'|'scoring'
  leader: PlayerId
}
