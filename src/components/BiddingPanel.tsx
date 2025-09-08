import React from 'react'
import type { Bid } from '../game/types'

export default function BiddingPanel(
  { handSize, onBid }: { handSize: number; onBid: (b: Bid) => void }
){
  const [value, setValue] = React.useState<number>(0)

  // Fix: Ensure handSize is a valid number and within safe bounds
  let max = 0
  if (typeof handSize === 'number' && Number.isFinite(handSize) && handSize >= 0) {
    max = Math.min(Math.floor(handSize), 9) // Clamp to max 9
  }

  // Always render 0..9, disable those above max
  const opts: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div className="panel" style={{ display:'flex', gap:8, alignItems:'center' }}>
      <strong>Your bid</strong>
      <select
        value={value}
        onChange={e => setValue(Number((e.target as HTMLSelectElement).value))}
      >
        {opts.map(n => (
          <option key={n} value={n} disabled={n > max}>{n}</option>
        ))}
      </select>
      <button onClick={() => value === 0 ? onBid({ type:'pass' }) : onBid({ type:'number', value })}>
        Declare
      </button>
      <span style={{ opacity:.8, fontSize:12 }}>Pass = 0 tricks for +50</span>
    </div>
  )
}
