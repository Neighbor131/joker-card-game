import React from 'react'
import type { Bid, PlayerId } from '../game/types'

export default function BiddingPanel({ 
  handSize, 
  onBid, 
  currentBids, 
  isDealer 
}: { 
  handSize: number; 
  onBid: (b: Bid) => void;
  currentBids: Partial<Record<PlayerId, Bid>>;
  isDealer: boolean;
}){
  const [value, setValue] = React.useState<number>(0)

  // Fix: Ensure handSize is a valid number and within safe bounds
  let max = 0
  if (typeof handSize === 'number' && Number.isFinite(handSize) && handSize >= 0) {
    max = Math.min(Math.floor(handSize), 9) // Clamp to max 9
  }

  // Calculate total of existing bids
  const totalBids = Object.values(currentBids).reduce((sum, bid) => {
    if (!bid) return sum
    return sum + (bid.type === 'pass' ? 0 : bid.value)
  }, 0)

  // For dealer: cannot bid a number that makes total equal to handSize
  const cannotBid = (bidValue: number) => {
    if (!isDealer) return false
    const newTotal = totalBids + bidValue
    return newTotal === handSize
  }

  // Always render 0..max, but disable invalid options
  const opts: number[] = []
  for (let i = 0; i <= max; i++) {
    opts.push(i)
  }

  return (
    <div className="panel" style={{ display:'flex', gap:8, alignItems:'center' }}>
      <strong>Your bid</strong>
      <select
        value={value}
        onChange={e => setValue(Number((e.target as HTMLSelectElement).value))}
      >
        {opts.map(n => {
          const disabled = n > max || cannotBid(n)
          return (
            <option key={n} value={n} disabled={disabled}>
              {n} {cannotBid(n) ? '(forbidden)' : ''}
            </option>
          )
        })}
      </select>
      <button 
        onClick={() => value === 0 ? onBid({ type:'pass' }) : onBid({ type:'number', value })}
        disabled={cannotBid(value)}
      >
        Declare
      </button>
      <div style={{ opacity:.8, fontSize:12 }}>
        <div>Pass = 0 bid (50pts if exact, 10×tricks if not)</div>
        {isDealer && <div style={{color:'#ff9a3c'}}>⚠️ Total bids cannot equal {handSize}</div>}
      </div>
    </div>
  )
}
