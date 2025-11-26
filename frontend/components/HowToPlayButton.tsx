'use client'

import { useState } from 'react'

export default function HowToPlayButton() {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px',
      border: '1px solid #ddd'
    }}>
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>📖 How to Play</span>
        <span>{showInstructions ? '▼' : '▶'}</span>
      </button>
      
      {showInstructions && (
        <div style={{ marginTop: '20px', lineHeight: '1.6' }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Game Instructions</h3>
          
          <h4 style={{ marginTop: '15px', marginBottom: '8px' }}>Getting Started</h4>
          <p style={{ marginBottom: '15px', fontSize: '14px' }}>
            1. Enter your name<br/>
            2. Create a new game or join an existing one (game names must be lowercase)<br/>
            3. Wait in the waiting room for other players<br/>
            4. The game creator sets the number of rounds and starts the game
          </p>
          
          <h4 style={{ marginTop: '15px', marginBottom: '8px' }}>How to Play</h4>
          <p style={{ marginBottom: '10px', fontSize: '14px' }}>
            Players take turns asking questions. Each turn has three phases:
          </p>
          <ol style={{ marginBottom: '15px', fontSize: '14px', paddingLeft: '20px' }}>
            <li><strong>Question Phase:</strong> The current player types a question</li>
            <li><strong>Answer Phase:</strong> Everyone (including the questioner) types a single word answer</li>
            <li><strong>Scoring Phase:</strong> Points are awarded based on matching words</li>
          </ol>
          
          <h4 style={{ marginTop: '15px', marginBottom: '8px' }}>Scoring</h4>
          <ul style={{ marginBottom: '15px', fontSize: '14px', paddingLeft: '20px' }}>
            <li>Match with other players: <strong>1 point per matching player</strong></li>
            <li>Match with questioner: <strong>+1 bonus point</strong></li>
            <li>Dud question (no matches OR everyone matches): <strong>Questioner loses 1 point</strong></li>
          </ul>
          
          <p style={{ marginTop: '15px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
            🎮 Play at: <a href="https://same-word.fly.dev/" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>same-word.fly.dev</a><br/>
            📺 Watch us build it: <a href="https://www.youtube.com/watch?v=BrQe1q-IKmY" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>YouTube</a>
          </p>
        </div>
      )}
    </div>
  )
}

