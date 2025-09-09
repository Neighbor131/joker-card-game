import React from 'react'
import { Suit } from '../game/types'

interface Props {
  isLeading: boolean
  onChoice: (high: boolean, leadSuit?: Suit) => void
}

export default function JokerChoicePanel({ isLeading, onChoice }: Props) {
  const [selectedHigh, setSelectedHigh] = React.useState<boolean>(true)
  
  function suitText(s: Suit){
    return s==='C'?'Clubs ♣': s==='D'?'Diamonds ♦': s==='H'?'Hearts ♥':'Spades ♠'
  }

  if (isLeading) {
    return (
      <div className="panel">
        <div style={{marginBottom: 8}}><strong>Leading with Joker - Choose:</strong></div>
        
        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <label style={{display:'flex', alignItems:'center', gap:4}}>
            <input 
              type="radio" 
              checked={selectedHigh} 
              onChange={() => setSelectedHigh(true)} 
            />
            High (usually wins)
          </label>
          <label style={{display:'flex', alignItems:'center', gap:4}}>
            <input 
              type="radio" 
              checked={!selectedHigh} 
              onChange={() => setSelectedHigh(false)} 
            />
            Low (usually loses)
          </label>
        </div>

        <div><strong>Specify suit to follow:</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:6}}>
          {(['C','D','H','S'] as Suit[]).map(s=>(
            <button 
              key={s} 
              onClick={()=>onChoice(selectedHigh, s)}
              style={{padding:'6px 8px'}}
            >
              {suitText(s)}
            </button>
          ))}
        </div>
        
        <div style={{fontSize:12, opacity:0.8, marginTop:8}}>
          Others must follow your chosen suit or trump/play other Joker
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div style={{marginBottom: 8}}><strong>Play Joker as:</strong></div>
      <div style={{display:'flex', gap:8}}>
        <button onClick={()=>onChoice(true)}>
          High (try to win)
        </button>
        <button onClick={()=>onChoice(false)}>
          Low (try to lose)
        </button>
      </div>
      <div style={{fontSize:12, opacity:0.8, marginTop:6}}>
        High Joker beats most cards; Low Joker loses to regular cards
      </div>
    </div>
  )
}
