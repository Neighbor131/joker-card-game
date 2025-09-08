import React from 'react'
import { Card } from '../game/types'
import { cardAssetFile } from '../game/deck'

const BASE = import.meta.env.BASE_URL ?? '/'

export default function CardView({
  card, hidden=false, disabled=false, onClick
}:{card:Card, hidden?:boolean, disabled?:boolean, onClick?:()=>void}){
  const src = hidden
    ? `${BASE}cards/2B.svg`
    : `${BASE}cards/${cardAssetFile(card)}`
  return (
    <div className={'card ' + (disabled?'disabled':'')} onClick={disabled?undefined:onClick}>
      <img src={src} alt={hidden?'Back':`${card.rank}${card.suit}`} />
      {card.isJoker && !hidden && <div className="jokerRibbon">JOKER</div>}
    </div>
  )
}
