# Joker (Georgian variant) – Browser game

Human vs 3 bots. Full 4-phase sequence (1→8, 9×4, 8→1, 9×4), bidding with Pass, trump selection rules, Joker logic (6♠ and 6♣ act as Jokers; overlay ribbon shown).

## Run locally
1. Ensure Node 18+ installed.
2. Install deps: `npm i`
3. Start dev server: `npm run dev` then open http://localhost:5173

## Build
`npm run build` then `npm run preview`

## Assets
Card SVGs are in `public/cards/` referencing your uploaded pack. Card back uses `2B.svg` by default.

## Rules implemented
- 36-card deck (6..A), 6♠ and 6♣ flagged as Jokers
- Phases: 1..8, then 9×4 (trump picked after seeing first 3 cards by player after dealer), then 8..1, then 9×4
- Trump: last stock card for phases 1 and 3; if last is Joker, play no-trump
- Bidding: sequential from player left of dealer; numbers 0..N or Pass (Pass = 0 target with +50 for exactly 0)
- Scoring: exact-bid table 1→100, 2→150, 3→200, 4→250, 5→300, 6→350, 7→400, 8→450, 9→900; otherwise −10 × tricks taken
- Khisht: if bid ≥1 and take 0, −200
- Joker: highest by default; if led, leader must choose a suit to demand; Joker can beat any card including a previously played Joker (later Joker wins the trick)

## Notes
- Bots use simple heuristics for bidding, picking trump, and card choice. This is intentionally light for clarity.
- An options toggle for "Joker as lowest" can be added later if needed.
