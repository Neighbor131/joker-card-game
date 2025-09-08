// Dealing sequence across 4 phases per Georgian Joker rules
// Phase 1: 1..8
// Phase 2: 9,9,9,9 (trump chosen by player after dealer after 3 cards)
// Phase 3: 8..1
// Phase 4: 9,9,9,9 (same as phase 2)

export function fullSequence(): { phase:number, handSize:number }[] {
  const seq: {phase:number, handSize:number}[] = []
  for (let n=1;n<=8;n++) seq.push({phase:1, handSize:n})
  for (let i=0;i<4;i++) seq.push({phase:2, handSize:9})
  for (let n=8;n>=1;n--) seq.push({phase:3, handSize:n})
  for (let i=0;i<4;i++) seq.push({phase:4, handSize:9})
  return seq
}
