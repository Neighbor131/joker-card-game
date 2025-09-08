import React from 'react'
import { Card } from '../game/types'
import { cardAssetFile } from '../game/deck'

export default function CardView({card, hidden=false, disabled=false, onClick}:{card:Card, hidden?:boolean, disabled?:boolean, onClick?:()=>void}){
  const src = hidden ? '/cards/2B.svg' : `/cards/${cardAssetFile(card)}`
  return (
    <div className={"card " + (disabled?'disabled':'')} onClick={disabled?undefined:onClick}>
      <img src={src} alt={hidden?'Back':`${card.rank}${card.suit}`} />
      {card.isJoker && !hidden && (
        <div className="jokerRibbon">JOKER</div>
      )}
    </div>
  )
}
