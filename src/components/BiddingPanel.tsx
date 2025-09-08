import React from 'react'
import type { Bid } from '../game/types'

export default function BiddingPanel(
  { handSize, onBid }: { handSize: number; onBid: (b: Bid) => void }
){
  const [value, setValue] = React.useState<number>(0)

  // non-negative integer only
  const max = Math.max(0, Number.isFinite(handSize) ? Math.trunc(handSize) : 0)
  const options = Array.from({ length: max + 1 }, (_, i) => i)

  return (
    <div className="panel" style={{ display:'flex', gap:8, alignItems:'center' }}>
      <strong>Your bid</strong>
      <select
        value={value}
        onChange={e => setValue(Number((e.target as HTMLSelectElement).value))}
      >
        {options.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button onClick={() => {
        if (value === 0) onBid({ type: 'pass' })
        else onBid({ type: 'number', value })
      }}>
        Declare
      </button>
      <span style={{ opacity:.8, fontSize:12 }}>Pass = 0 tricks for +50</span>
    </div>
  )
}
