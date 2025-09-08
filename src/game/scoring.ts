import { Bid, PlayerId } from './types'

const EXACT_POINTS: Record<number, number> = {
  1:100,2:150,3:200,4:250,5:300,6:350,7:400,8:450,9:900
}

export function scoreFor(player: PlayerId, bid: Bid, taken: number, khishtPenalty: number): {score:number, khisht:boolean} {
  if (bid.type === 'pass') {
    if (taken === 0) return { score: 50, khisht: false }
    return { score: -10 * taken, khisht: false }
  } else {
    if (taken === 0) {
      // khisht if bid >=1 and took zero
      return { score: khishtPenalty, khisht: true }
    }
    if (taken === bid.value) {
      const pts = EXACT_POINTS[bid.value] ?? (bid.value*100)
      return { score: pts, khisht: false }
    }
    return { score: -10 * taken, khisht: false }
  }
}
