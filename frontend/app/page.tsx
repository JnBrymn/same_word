'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [joinGameName, setJoinGameName] = useState('')
  const [createGameName, setCreateGameName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  const handleCreateGame = async () => {
    setError('')
    
    // Validation
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!createGameName.trim()) {
      setError('Please enter a game name')
      return
    }
    if (createGameName !== createGameName.toLowerCase()) {
      setError('Game name must be lowercase')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/games/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_name: createGameName.toLowerCase(),
          player_name: playerName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create game')
      }

      if (data.success) {
        router.push(`/waiting-room?game_id=${data.game_id}&player_id=${data.player_id}`)
      } else {
        setError('Failed to create game')
      }
    } catch (error: any) {
      setError(error.message || 'Error creating game')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGame = async () => {
    setError('')
    
    // Validation
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!joinGameName.trim()) {
      setError('Please enter a game name')
      return
    }
    if (joinGameName !== joinGameName.toLowerCase()) {
      setError('Game name must be lowercase')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/games/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_name: joinGameName.toLowerCase(),
          player_name: playerName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to join game')
      }

      if (data.success) {
        router.push(`/waiting-room?game_id=${data.game_id}&player_id=${data.player_id}`)
      } else {
        setError(data.error || 'Failed to join game')
      }
    } catch (error: any) {
      setError(error.message || 'Error joining game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      padding: '50px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Same Word</h1>
      
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
      
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Your Name:
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          style={{
            padding: '10px',
            fontSize: '16px',
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Join a game:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={joinGameName}
            onChange={(e) => setJoinGameName(e.target.value.toLowerCase())}
            placeholder="Enter game name (lowercase)"
            style={{
              padding: '10px',
              fontSize: '16px',
              flex: 1,
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleJoinGame}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            GO
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Create new game:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={createGameName}
            onChange={(e) => setCreateGameName(e.target.value.toLowerCase())}
            placeholder="Enter game name (lowercase)"
            style={{
              padding: '10px',
              fontSize: '16px',
              flex: 1,
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleCreateGame}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            GO
          </button>
        </div>
      </div>
    </main>
  )
}

