import React from 'react'
import { Bid, Card, DealResult, GameState, PlayerId, Suit, Trick } from '../game/types'
import { makeDeck, cardAssetFile } from '../game/deck'
import { mulberry32, nextPlayer } from '../game/util'
import { resolveWinner } from '../game/rules'
import { scoreFor } from '../game/scoring'
import { aiBid, aiPickTrump, aiPlay } from '../game/ai'
import TrumpPicker from './TrumpPicker'
import CardView from './CardView'
import BiddingPanel from './BiddingPanel'
import Scoreboard from './Scoreboard'
import { fullSequence } from '../game/sequences'

const SEQ = fullSequence()
const KHISHT_PENALTY = -200

export default function Table(){
  const [state, setState] = React.useState<GameState>(()=>initGame())
  const [seqIndex,setSeqIndex] = React.useState(0)
  const seq = SEQ[seqIndex]
  React.useEffect(()=>{
    // start first deal
    startDeal(state, seq, setState)
  },[])

  function nextDeal(){
    const next = (seqIndex+1) % SEQ.length
    setSeqIndex(next)
    const s = {...state}
    s.dealer = nextPlayer(state.dealer)
    s.phase = SEQ[next].phase
    s.handSize = SEQ[next].handSize
    startDeal(s, SEQ[next], setState)
  }

  const you = 0 as PlayerId

  // Handle human actions
  function onHumanBid(b: Bid){
    if (state.awaiting !== 'bidding') return
    const s = {...state}
    s.bids[0] = b
    setState(s)
    window.setTimeout(()=>advanceBidding(s, setState, seq, nextDeal), 400)
  }
  function onHumanPlay(card: Card){
    if (state.awaiting !== 'play') return
    const isYourTurn = state.trick?.plays.length===0 ? state.leader===0 : nextPlayer(state.trick!.plays[state.trick!.plays.length-1].player)===0
    if (!isYourTurn) return
    // Check legality
    const trick = state.trick!
    const hand = state.hands[0]
    const hasLead = (()=>{
      if (trick.plays.length===0) return false
      const lead = trick.plays[0]
      const leadSuit: Suit | null = lead.card.isJoker ? (trick.declaredLeadSuit ?? null) : lead.card.suit
      return hand.some(c => !c.isJoker && c.suit===leadSuit)
    })()
    if (trick.plays.length>0 && hasLead && !card.isJoker){
      const leadSuit = trick.plays[0].card.isJoker ? (trick.declaredLeadSuit ?? null) : trick.plays[0].card.suit
      if (leadSuit && card.suit!==leadSuit) return // must follow
    }
    playCard(0, card)
  }
  function onPickLeadSuit(suit: Suit){
    // Only when leader played Joker
    const s = {...state}
    if (!s.trick) return
    s.trick.declaredLeadSuit = suit
    setState(s)
  }

  function playCard(player: PlayerId, card: Card, declaredSuit?: Suit){
    const s = {...state}
    const hand = s.hands[player]
    s.hands[player] = hand.filter(c => c.id !== card.id)
    if (!s.trick) {
      s.trick = { leader: player, plays: [] }
    }
    s.trick.plays.push({ player, card, declaredSuit })
    setState(s)
    // If leader played Joker with no declared suit yet and player==leader, and card is Joker, prompt suit via quick UI
    window.setTimeout(()=>advancePlay(s, setState, seq, nextDeal), 300)
  }

  // Derived helpers
  const yourHand = state.hands[0] ?? []
  const centerPlays: (Card | null)[] = [null,null,null,null]
  if (state.trick){
    for (const p of state.trick.plays){
      centerPlays[p.player] = p.card
    }
  }

  return (
    <div className="table">
      <div className="p2 hand">
        {/* Top bot hand */}
        {(state.hands[1]||[]).map((c,i)=>(<CardView key={c.id} card={c} hidden />))}
      </div>
      <div className="p3 hand" style={{justifySelf:'start'}}>
        {(state.hands[2]||[]).map((c,i)=>(<CardView key={c.id} card={c} hidden />))}
      </div>
      <div className="center">
        {[1,2,3,0].map(pid=>(
          <div className="slot" key={pid}>
            {centerPlays[pid] ? <CardView card={centerPlays[pid]!} /> : <span style={{opacity:.5}}>—</span>}
          </div>
        ))}
      </div>
      <div className="p1 hand" style={{justifySelf:'end'}}>
        {(state.hands[3]||[]).map((c,i)=>(<CardView key={c.id} card={c} hidden />))}
      </div>
      <div className="p4" style={{alignSelf:'start'}}>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <Scoreboard scores={state.scores} bids={state.bids} />
          <div className="panel">
            <div><strong>Phase</strong> {state.phase} • <strong>Hand</strong> {state.handSize} • <strong>Dealer</strong> {state.dealer===0?'You':`Bot ${state.dealer}`}</div>
            <div style={{marginTop:6}}><strong>Trump:</strong> {state.trump ? suitText(state.trump) : 'No-trump'}</div>
            {state.awaiting==='bidding' && state.bids[0]==null && (
              <div style={{marginTop:8}}><BiddingPanel handSize={state.handSize} onBid={onHumanBid} /></div>
            )}
            {state.awaiting==='trump-pick' && state.trumpDecider===0 && (
              <div style={{marginTop:8}}><TrumpPicker onPick={(s)=>{ const copy={...state}; copy.trump=s; copy.awaiting='bidding'; setState(copy)}} /></div>
            )}
            {state.trick && state.trick.plays.length===1 && state.trick.plays[0].player===0 && state.trick.plays[0].card.isJoker && !state.trick.declaredLeadSuit && (
              <div style={{marginTop:8}}>
                <div className="panel" style={{display:'flex', gap:6, alignItems:'center'}}>
                  <span><strong>Lead suit</strong> for Joker:</span>
                  {(['C','D','H','S'] as Suit[]).map(s=>(<button key={s} onClick={()=>onPickLeadSuit(s)}>{suitText(s)}</button>))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{marginTop:10}} className="hand">
          {yourHand.map(c=>(
            <CardView key={c.id} card={c} onClick={()=>onHumanPlay(c)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function initGame(): GameState {
  return {
    rngSeed: Math.floor(Math.random()*1e9),
    players: ['You','Bot 1','Bot 2','Bot 3'],
    dealer: 3, // so first deal dealer rotates to 0
    phase: 1,
    handSize: 1,
    trump: null,
    jokerLowest: false,
    hands: {0:[],1:[],2:[],3:[]},
    table: [null,null,null,null],
    bids: {},
    taken: {0:0,1:0,2:0,3:0},
    scores: [0,0,0,0],
    history: [],
    awaiting: 'bidding',
    leader: 0,
  }
}

function startDeal(base: GameState, seq: {phase:number, handSize:number}, setState: (s:GameState)=>void){
  const s: GameState = JSON.parse(JSON.stringify(base))
  s.phase = seq.phase
  s.handSize = seq.handSize
  s.taken = {0:0,1:0,2:0,3:0}
  s.bids = {}
  s.trick = undefined
  const deck = makeDeck(Math.floor(Math.random()*1e9))
  // Determine trump policy
  if (seq.handSize === 9 && (seq.phase===2 || seq.phase===4)) {
    s.trumpDecider = ((s.dealer+1)%4) as PlayerId
  } else {
    // trump is last stock card
    const last = deck[deck.length-1]
    s.trump = last.isJoker ? null : last.suit
    s.trumpDecider = undefined
  }
  // deal N cards to each
  for (let p=0;p<4;p++){
    s.hands[p as PlayerId] = deck.slice(p*seq.handSize, p*seq.handSize + seq.handSize)
  }
  // On 9-card deals with trump pick rule: deal 3, let decider pick trump, then remaining 6
  if (seq.handSize===9 && s.trumpDecider!=null){
    // redeal: 3 to each, then pick, then 6 to each
    const deck2 = makeDeck(Math.floor(Math.random()*1e9))
    const hands: Record<PlayerId, Card[]> = {0:[],1:[],2:[],3:[]}
    let idx = 0
    // first 3
    for (let k=0;k<3;k++){
      for (let p=0;p<4;p++){
        hands[p as PlayerId].push(deck2[idx++])
      }
    }
    s.hands = hands
    // pick trump
    if (s.trumpDecider===0){
      s.awaiting = 'trump-pick'
    } else {
      s.trump = aiPickTrump(s.trumpDecider, s.hands)
      s.awaiting = 'bidding'
    }
    // deal remaining 6
    for (let k=0;k<6;k++){
      for (let p=0;p<4;p++){
        hands[p as PlayerId].push(deck2[idx++])
      }
    }
  } else {
    s.awaiting = 'bidding'
  }
  s.leader = ((s.dealer+1) % 4) as PlayerId
  setState(s)
  // If bots start bidding
  if (s.awaiting==='bidding') {
    window.setTimeout(()=>advanceBidding(s, setState, seq, ()=>{}), 400)
  }
}

function advanceBidding(state: GameState, setState: (s:GameState)=>void, seq:{phase:number, handSize:number}, nextDeal:()=>void){
  const s = JSON.parse(JSON.stringify(state)) as GameState
  // Who hasn't bid yet?
  for (let p=0;p<4;p++){
    const pid = ((s.dealer+1+p)%4) as PlayerId
    if (s.bids[pid]==null){
      if (pid===0) { setState(s); return } // wait for human
      const b = aiBid(pid, s.hands[pid], s.trump??null, seq.handSize)
      s.bids[pid] = b
      setState(s)
      window.setTimeout(()=>advanceBidding(s,setState,seq,nextDeal), 300)
      return
    }
  }
  // all bids in
  s.awaiting = 'play'
  s.trick = undefined
  s.leader = ((s.dealer+1)%4) as PlayerId
  setState(s)
  // If leader is bot, let them start
  if (s.leader!==0){
    window.setTimeout(()=>botPlayTurn(s,setState,seq,nextDeal), 500)
  }
}

function botPlayTurn(state: GameState, setState: (s:GameState)=>void, seq:{phase:number, handSize:number}, nextDeal:()=>void){
  const s = JSON.parse(JSON.stringify(state)) as GameState
  const trick = s.trick ?? { leader: s.leader, plays: [] as Trick['plays'] }
  const current = trick.plays.length===0? s.leader : nextActor(trick)
  if (current===0) { setState(s); return }
  const hand = s.hands[current]
  let leadSuit: Suit | null = null
  if (trick.plays.length>0){
    const lead = trick.plays[0]
    leadSuit = lead.card.isJoker ? (s.trick?.declaredLeadSuit ?? null) : lead.card.suit
  }
  const mustFollow = !!leadSuit && hand.some(c => !c.isJoker && c.suit===leadSuit)
  const needToWin = needWinHeuristic(current, s)
  const choice = aiPlay(current, hand, leadSuit, s.trump, mustFollow, needToWin)
  // If bot leads with Joker, choose a lead suit
  let declaredSuit: Suit | undefined = undefined
  if (trick.plays.length===0 && choice.isJoker){
    declaredSuit = pickLeadSuitForJoker(hand, s.trump)
    s.trick = { leader: current, plays: [{player: current, card: choice, declaredSuit}], declaredLeadSuit: declaredSuit }
  } else {
    s.trick = trick
    s.trick.plays.push({ player: current, card: choice })
  }
  s.hands[current] = hand.filter(c => c.id !== choice.id)
  setState(s)
  window.setTimeout(()=>advancePlay(s,setState,seq,nextDeal), 300)
}

function advancePlay(state: GameState, setState: (s:GameState)=>void, seq:{phase:number, handSize:number}, nextDeal:()=>void){
  const s = JSON.parse(JSON.stringify(state)) as GameState
  const trick = s.trick!
  if (!trick || trick.plays.length<1) { setState(s); return }
  // If leader played Joker and hasn't declared lead suit yet and leader is human, wait for input
  if (trick.plays.length===1 && trick.plays[0].player===0 && trick.plays[0].card.isJoker && !s.trick?.declaredLeadSuit){
    setState(s); return
  }
  // If trick incomplete, prompt next actor
  if (trick.plays.length < 4){
    const current = nextActor(trick)
    if (current===0){
      setState(s); return
    } else {
      window.setTimeout(()=>botPlayTurn(s,setState,seq,nextDeal), 350)
      return
    }
  }
  // resolve
  const winner = resolveWinner(trick, s.trump, s.jokerLowest)
  s.trick.winner = winner
  s.taken[winner] += 1
  s.leader = winner
  setState(s)
  // clear trick after a pause
  window.setTimeout(()=>{
    // if hands empty, score
    const done = s.hands[0].length===0
    if (done){
      // score this deal
      const res = scoreDeal(s)
      s.history.push(res)
      s.scores = s.scores.map((v,i)=>v + res.scores[i as 0|1|2|3])
      s.awaiting = 'scoring'
      setState(s)
      window.setTimeout(()=>nextDeal(), 1000)
    } else {
      s.trick = undefined
      setState(s)
      // If next leader is bot, let them play
      if (s.leader!==0) window.setTimeout(()=>botPlayTurn(s,setState,seq,nextDeal), 500)
    }
  }, 600)
}

function scoreDeal(s: GameState): DealResult {
  const scores: Record<PlayerId, number> = {0:0,1:0,2:0,3:0}
  const khishtApplied: Record<PlayerId, boolean> = {0:false,1:false,2:false,3:false}
  ;[0,1,2,3].forEach(pid=>{
    const bid = s.bids[pid as PlayerId] ?? {type:'pass'} as Bid
    const taken = s.taken[pid as PlayerId]
    const res = scoreFor(pid as PlayerId, bid, taken, -200)
    scores[pid as PlayerId] = res.score
    khishtApplied[pid as PlayerId] = res.khisht
  })
  return { bids: s.bids as any, taken: s.taken, scores, khishtApplied, trump: s.trump }
}

function suitText(s: Suit){
  return s==='C'?'Clubs ♣': s==='D'?'Diamonds ♦': s==='H'?'Hearts ♥':'Spades ♠'
}

function nextActor(trick: Trick): PlayerId {
  const last = trick.plays[trick.plays.length-1].player
  return ((last+1)%4) as PlayerId
}

function needWinHeuristic(p: PlayerId, s: GameState): boolean {
  const bid = s.bids[p] ?? {type:'pass'} as Bid
  if (bid.type==='pass') return false
  const remaining = s.hands[p].length
  const need = Math.max(0, bid.value - s.taken[p])
  return need >= Math.ceil(remaining/2)
}

function pickLeadSuitForJoker(hand: Card[], trump: Suit|null): Suit {
  // choose strongest suit or trump if set
  const suits: Suit[] = ['C','D','H','S']
  if (trump) return trump
  const counts: Record<Suit, number> = {C:0,D:0,H:0,S:0}
  for (const c of hand) if (!c.isJoker) counts[c.suit] += {'A':9,'K':8,'Q':7,'J':6,'T':5,'9':4,'8':3,'7':2,'6':1}[c.rank]
  return suits.sort((a,b)=>counts[b]-counts[a])[0]
}
