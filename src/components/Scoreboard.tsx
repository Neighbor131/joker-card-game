import React from 'react'
import { Bid, PlayerId } from '../game/types'

export default function Scoreboard({scores, bids}:{scores:number[], bids:Partial<Record<PlayerId,Bid>>}){
  return (
    <div className="panel" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, minWidth: 520}}>
      {scores.map((s,i)=>(
        <div key={i} style={{background:'rgba(0,0,0,.2)', padding:8, borderRadius:8}}>
          <div style={{opacity:.8, fontSize:12}}>{i===0?'You':`Bot ${i}`}</div>
          <div style={{fontSize:20, fontWeight:800}}>{s}</div>
          <div style={{fontSize:12, opacity:.8}}>
            {bids[i as 0|1|2|3] ? renderBid(bids[i as 0|1|2|3]!) : '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderBid(b: Bid){
  if (b.type==='pass') return 'Pass'
  return `Bid ${b.value}`
}
