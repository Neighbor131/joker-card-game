import React from 'react'
import type { Card } from '../game/types'
import { cardAssetFile } from '../game/deck'

// Works both locally and on GitHub Pages
const BASE = import.meta.env.BASE_URL || '/'

type Props = {
  card: Card
  hidden?: boolean
  disabled?: boolean
  onClick?: () => void
}

export default function CardView({ card, hidden = false, disabled = false, onClick }: Props) {
  const src = hidden ? `${BASE}cards/2B.svg` : `${BASE}cards/${cardAssetFile(card)}`
  return (
    <div className={`card ${disabled ? 'disabled' : ''}`} onClick={disabled ? undefined : onClick}>
      <img src={src} alt={hidden ? 'Back' : `${card.rank}${card.suit}`} />
      {card.isJoker && !hidden && <div className="jokerRibbon">JOKER</div>}
    </div>
  )
}
