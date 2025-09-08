import React from 'react'
import type { Bid } from '../game/types'

export default function BiddingPanel(
  { handSize, onBid }: { handSize: number; onBid: (b: Bid) => void }
){
  const [value, setValue] = React.useState<number>(0)

  // Clamp to an integer in [0..9], no Array.from at all.
  let max = Number.isFinite(handSize) ? Math.trunc(handSize) : 0
  if (max < 0) max = 0
  if (max > 9) max = 9

  const opts: number[] = []
  for (let i = 0; i <= max; i++) opts.push(i)

  return (
    <div className="panel" style={{ display:'flex', gap:8, alignItems:'center' }}>
      <strong>Your bid</strong>
      <select
        value={value}
        onChange={e => setValue(Number((e.target as HTMLSelectElement).value))}
      >
        {opts.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <button onClick={() => value === 0 ? onBid({ type:'pass' }) : onBid({ type:'number', value })}>
        Declare
      </button>
      <span style={{ opacity:.8, fontSize:12 }}>Pass = 0 tricks for +50</span>
    </div>
  )
}
