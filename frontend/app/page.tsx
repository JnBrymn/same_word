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

