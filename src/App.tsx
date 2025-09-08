import React from 'react'
import Table from './components/Table'
export default function App(){
  return (
    <div className="app">
      <div className="topbar">
        <strong>Joker</strong> • Georgian variant • Human vs 3 Bots
      </div>
      <Table />
      <div className="scoreboard" id="footer">
        <span className="badge">Background: dark green, easy on the eyes</span>
        <span className="badge">Rules in English; visuals from your deck</span>
      </div>
    </div>
  )
}
