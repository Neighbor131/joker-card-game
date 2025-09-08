import React from 'react'
import { Suit } from '../game/types'

export default function TrumpPicker({onPick}:{onPick:(s:Suit|null)=>void}){
  return (
    <div className="panel" style={{display:'flex', gap:8, alignItems:'center'}}>
      <strong>Pick trump</strong>
      <button onClick={()=>onPick('C')}>Clubs ♣</button>
      <button onClick={()=>onPick('D')}>Diamonds ♦</button>
      <button onClick={()=>onPick('H')}>Hearts ♥</button>
      <button onClick={()=>onPick('S')}>Spades ♠</button>
      <button onClick={()=>onPick(null)}>No-trump</button>
    </div>
  )
}
