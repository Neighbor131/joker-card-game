import React from 'react'
import { Bid } from '../game/types'

export default function BiddingPanel({handSize, onBid}:{handSize:number, onBid:(b:Bid)=>void}){
  const [value,setValue] = React.useState<number>(0)
  return (
    <div className="panel" style={{display:'flex', gap:8, alignItems:'center'}}>
      <strong>Your bid</strong>
      <select value={value} onChange={e=>setValue(parseInt(e.target.value))}>
        {Array.from({length: handSize+1}, (_,i)=>i).map(n=>(
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button onClick={()=>{
        if (value===0) onBid({type:'pass'})
        else onBid({type:'number', value})
      }}>Declare</button>
      <span style={{opacity:.8,fontSize:12}}>Pass = 0 tricks for +50</span>
    </div>
  )
}
