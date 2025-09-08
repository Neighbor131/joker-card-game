import { Bid, PlayerId } from './types'

export function scoreFor(player: PlayerId, bid: Bid, taken: number, khishtPenalty: number): {score:number, khisht:boolean} {
  if (bid.type === 'pass') {
    // Pass means bid 0 tricks
    if (taken === 0) {
      return { score: 50, khisht: false } // Exact pass = 50 points
    } else {
      return { score: 10 * taken, khisht: false } // Failed pass = 10 points per trick taken
    }
  } else {
    // Numbered bid
    if (taken === 0 && bid.value >= 1) {
      // Khisht: bid 1+ but took 0 tricks
      return { score: khishtPenalty, khisht: true }
    }
    if (taken === bid.value) {
      // Exact bid: 50 points per trick + 50 bonus
      return { score: 50 * bid.value + 50, khisht: false }
    } else {
      // Failed bid: 10 points per trick taken
      return { score: 10 * taken, khisht: false }
    }
  }
}
