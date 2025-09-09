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

export default function Table(){
  const [state, setState] = React.useState<GameState>(()=>initGame())
  const [seqIndex,setSeqIndex] = React.useState(0)
  const seq = SEQ[seqIndex] || { phase: 1, handSize: 1 }
  
  React.useEffect(()=>{
    if (seq) {
      startDeal(state, seq, setState)
    }
  },[])

  function nextDeal(){
    const next = (seqIndex+1) % SEQ.length
    setSeqIndex(next)
    const s = {...state}
    s.dealer = nextPlayer(state.dealer)
    const nextSeq = SEQ[next] || { phase: 1, handSize: 1 }
    s.phase = nextSeq.phase
    s.handSize = nextSeq.handSize
    startDeal(s, nextSeq, setState)
  }

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
    
    // If playing a Joker, need to choose high/low
    if (card.isJoker) {
      const s = {...state}
      s.pendingJokerPlay = { player: 0, card }
      s.awaiting = 'joker-choice'
      setState(s)
      return
    }
    
    // Check legality for non-Jokers
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

  function onJokerChoice(high: boolean, leadSuit?: Suit) {
    if (!state.pendingJokerPlay) return
    const { player, card } = state.pendingJokerPlay
    const s = {...state}
    s.pendingJokerPlay = undefined
    s.awaiting = 'play'
    
    // Play the Joker with the choice
    playCard(player, card, undefined, high, leadSuit)
  }

  function onPickLeadSuit(suit: Suit){
    const s = {...state}
    if (!s.trick) return
    s.trick.declaredLeadSuit = suit
    setState(s)
  }

  function playCard(player: PlayerId, card: Card, declaredSuit?: Suit, jokerHigh?: boolean, jokerLeadSuit?: Suit){
    const s = {...state}
    const hand = s.hands[player] || []
    s.hands[player] = hand.filter(c => c.id !== card.id)
    
    if (!s.trick) {
      s.trick = { leader: player, plays: [] }
    }
    
    const play: Trick['plays'][0] = { player, card, declaredSuit }
    if (card.isJoker) {
      play.jokerHigh = jokerHigh
    }
    
    s.trick.plays.push(play)
    
    // If Joker led and suit specified
    if (s.trick.plays.length === 1 && card.isJoker && jokerLeadSuit) {
      s.trick.declaredLeadSuit = jokerLeadSuit
    }
    
    setState(s)
    window.setTimeout(()=>advancePlay(s, setState, seq, nextDeal), 300)
  }

  // Derived helpers
  const yourHand = state.hands[0] || []
  const centerPlays: (Card | null)[] = [null,null,null,null]
  if (state.trick){
    for (const p of state.trick.plays){
      centerPlays[p.player] = p.card
    }
  }

  const safeHandSize = typeof state.handSize === 'number' && Number.isFinite(state.handSize) && state.handSize >= 0 
    ? Math.min(state.handSize, 9) 
    : 1

  // Check if human is dealer (for bidding constraint)
  const totalBidsBeforeHuman = Object.keys(state.bids).length
  const isHumanDealer = ((state.dealer + 1 + 3) % 4) === 0 // Human bids last when dealer

  return (
    <div className="table">
      <div className="p2 hand">
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
            
            {state.awaiting === 'bidding' && state.bids[0] == null && (
              <div style={{ marginTop: 8 }}>
                <BiddingPanel
                  handSize={safeHandSize}
                  onBid={onHumanBid}
                  currentBids={state.bids}
                  isDealer={isHumanDealer}
                />
              </div>
            )}

            {state.awaiting === 'joker-choice' && state.pendingJokerPlay && (
              <div style={{marginTop:8}}>
                <div className="panel">
                  <div><strong>Play Joker as:</strong></div>
                  <div style={{display:'flex', gap:6, marginTop:6}}>
                    <button onClick={()=>onJokerChoice(true)}>High</button>
                    <button onClick={()=>onJokerChoice(false)}>Low</button>
                  </div>
                  {(!state.trick || state.trick.plays.length === 0) && (
                    <div style={{marginTop:8}}>
                      <div><strong>Specify suit:</strong></div>
                      <div style={{display:'flex', gap:4, marginTop:4}}>
                        {(['C','D','H','S'] as Suit[]).map(s=>(
                          <button key={s} onClick={()=>onJokerChoice(true, s)}>{suitText(s)} High</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {state.awaiting==='trump-pick' && state.trumpDecider===0 && (
              <div style={{marginTop:8}}><TrumpPicker onPick={(s)=>{ const copy={...state}; copy.trump=s; copy.awaiting='bidding'; setState(copy)}} /></div>
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
    dealer: 3,
    phase: 1,
    handSize: 1,
    trump: null,
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
  if (!seq || typeof seq.handSize !== 'number' || seq.handSize < 0 || seq.handSize > 9) {
    console.error('Invalid sequence:', seq)
    return
  }

  const s: GameState = JSON.parse(JSON.stringify(base))
  s.phase = seq.phase
  s.handSize = seq.handSize
  s.taken = {0:0,1:0,2:0,3:0}
  s.bids = {}
  s.trick = undefined
  
  try {
    const deck = makeDeck(Math.floor(Math.random()*1e9))
    
    // FIXED: Proper trump determination for Georgian Joker
    if (seq.handSize === 9 && (seq.phase === 2 || seq.phase === 4)) {
      // 9-card deals: dealer's last card determines trump
      const dealerIdx = s.dealer
      const dealerLastCard = deck[dealerIdx * seq.handSize + seq.handSize - 1]
      s.trump = dealerLastCard?.isJoker ? null : dealerLastCard?.suit || null
    } else {
      // Regular deals: next card after dealing determines trump
      const trumpCard = deck[4 * seq.handSize]
      s.trump = trumpCard?.isJoker ? null : trumpCard?.suit || null
    }
    
    // Deal cards
    for (let p=0;p<4;p++){
      const startIdx = p * seq.handSize
      const endIdx = startIdx + seq.handSize
      if (startIdx < deck.length && endIdx <= deck.length) {
        s.hands[p as PlayerId] = deck.slice(startIdx, endIdx)
      } else {
        s.hands[p as PlayerId] = []
      }
    }
    
    s.awaiting = 'bidding'
    s.leader = ((s.dealer+1) % 4) as PlayerId
    setState(s)
    
    // Start bot bidding if needed
    window.setTimeout(()=>advanceBidding(s, setState, seq, ()=>{}), 400)
  } catch (error) {
    console.error('Error in startDeal:', error)
  }
}

function advanceBidding(state: GameState, setState: (s:GameState)=>void, seq:{phase:number, handSize:number}, nextDeal:()=>void){
  const s = JSON.parse(JSON.stringify(state)) as GameState
  
  // Who hasn't bid yet?
  for (let p=0;p<4;p++){
    const pid = ((s.dealer+1+p)%4) as PlayerId
    if (s.bids[pid]==null){
      if (pid===0) { setState(s); return } // wait for human
      
      const hand = s.hands[pid] || []
      const isDealer = p === 3 // Last to bid
      const b = aiBid(pid, hand, s.trump??null, seq.handSize, s.bids, isDealer)
      s.bids[pid] = b
      setState(s)
      window.setTimeout(()=>advanceBidding(s,setState,seq,nextDeal), 300)
      return
    }
  }
  
  // All bids in - start play
  s.awaiting = 'play'
  s.trick = undefined
  s.leader = ((s.dealer+1)%4) as PlayerId
  setState(s)
  
  if (s.leader!==0){
    window.setTimeout(()=>botPlayTurn(s,setState,seq,nextDeal), 500)
  }
}

function botPlayTurn(state: GameState, setState: (s:GameState)=>void, seq:{phase:number, handSize:number}, nextDeal:()=>void){
  const s = JSON.parse(JSON.stringify(state)) as GameState
  const trick = s.trick ?? { leader: s.leader, plays: [] as Trick['plays'] }
  const current = trick.plays.length===0? s.leader : nextActor(trick)
  if (current===0) { setState(s); return }
  
  const hand = s.hands[current] || []
  let leadSuit: Suit | null = null
  if (trick.plays.length>0){
    const lead = trick.plays[0]
    leadSuit = lead.card.isJoker ? (s.trick?.declaredLeadSuit ?? null) : lead.card.suit
  }
  
  const mustFollow = !!leadSuit && hand.some(c => !c.isJoker && c.suit===leadSuit)
  const needToWin = needWinHeuristic(current, s)
  const choice = aiPlay(current, hand, leadSuit, s.trump, mustFollow, needToWin)
  
  // If bot plays Joker, make high/low decision and suit choice if leading
  if (choice.isJoker) {
    const jokerHigh = needToWin || Math.random() > 0.3 // Usually play high
    let leadSuit: Suit | undefined = undefined
    
    if (trick.plays.length === 0) {
      // Leading with Joker - choose suit
      leadSuit = pickLeadSuitForJoker(hand, s.trump)
      s.trick = { leader: current, plays: [] }
      s.trick.plays.push({ player: current, card: choice, jokerHigh })
      s.trick.declaredLeadSuit = leadSuit
    } else {
      s.trick = trick
      s.trick.plays.push({ player: current, card: choice, jokerHigh })
    }
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
  
  // If trick incomplete, continue
  if (trick.plays.length < 4){
    const current = nextActor(trick)
    if (current===0){
      setState(s); return
    } else {
      window.setTimeout(()=>botPlayTurn(s,setState,seq,nextDeal), 350)
      return
    }
  }
  
  // Resolve trick
  const winner = resolveWinner(trick, s.trump)
  s.trick.winner = winner
  s.taken[winner] += 1
  s.leader = winner
  setState(s)
  
  // Clear trick and continue or score
  window.setTimeout(()=>{
    const done = (s.hands[0] || []).length===0
    if (done){
      const res = scoreDeal(s)
      s.history.push(res)
      s.scores = s.scores.map((v,i)=>v + res.scores[i as 0|1|2|3])
      s.awaiting = 'scoring'
      setState(s)
      window.setTimeout(()=>nextDeal(), 1000)
    } else {
      s.trick = undefined
      setState(s)
      if (s.leader!==0) window.setTimeout(()=>botPlayTurn(s,setState,seq,nextDeal), 500)
    }
  }, 600)
}

function scoreDeal(s: GameState): DealResult {
  const scores: Record<PlayerId, number> = {0:0,1:0,2:0,3:0}
  const khishtApplied: Record<PlayerId, boolean> = {0:false,1:false,2:false,3:false}
  
  // Apply proper khisht penalties based on phase
  const khishtPenalty = (s.phase === 2 || s.phase === 4) ? -500 : -200
  
  ;[0,1,2,3].forEach(pid=>{
    const bid = s.bids[pid as PlayerId] ?? {type:'pass'} as Bid
    const taken = s.taken[pid as PlayerId]
    const res = scoreFor(pid as PlayerId, bid, taken, khishtPenalty)
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
  const remaining = (s.hands[p] || []).length
  const need = Math.max(0, bid.value - s.taken[p])
  return need >= Math.ceil(remaining/2)
}

function pickLeadSuitForJoker(hand: Card[], trump: Suit|null): Suit {
  const suits: Suit[] = ['C','D','H','S']
  if (trump) return trump
  const counts: Record<Suit, number> = {C:0,D:0,H:0,S:0}
  for (const c of hand) if (!c.isJoker) counts[c.suit] += {'A':9,'K':8,'Q':7,'J':6,'T':5,'9':4,'8':3,'7':2,'6':1}[c.rank]
  return suits.sort((a,b)=>counts[b]-counts[a])[0]
}
