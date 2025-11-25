'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Player {
  name: string
  player_id: string
  score: number
  is_creator: boolean
}

interface GameState {
  game_id: string
  game_name: string
  players: Player[]
  creator_id: string
  status: string
  rounds_per_player: number | null
  current_turn_index: number | null
  current_round: number
}

function WaitingRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameId = searchParams.get('game_id')
  const playerId = searchParams.get('player_id')

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [rounds, setRounds] = useState('3')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  useEffect(() => {
    if (!gameId || !playerId) {
      router.push('/')
      return
    }

    // Poll for game state updates
    const fetchGameState = async () => {
      try {
        const res = await fetch(`${apiUrl}/games/${gameId}`)
        if (!res.ok) {
          throw new Error('Failed to fetch game state')
        }
        const data = await res.json()
        setGameState(data)

        // Auto-redirect if game has started
        if (data.status === 'playing') {
          router.push(`/game?game_id=${gameId}&player_id=${playerId}`)
        }
      } catch (error) {
        console.error('Error fetching game state:', error)
      }
    }

    // Initial fetch
    fetchGameState()

    // Poll every 1.5 seconds
    const interval = setInterval(fetchGameState, 1500)

    return () => clearInterval(interval)
  }, [gameId, playerId, router, apiUrl])

  const handleStartGame = async () => {
    if (!gameId || !playerId) return

    setError('')
    const roundsNum = parseInt(rounds)
    
    if (isNaN(roundsNum) || roundsNum < 1) {
      setError('Please enter a valid number of rounds (at least 1)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/games/${gameId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          rounds_per_player: roundsNum,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to start game')
      }

      if (data.success) {
        // Redirect will happen automatically via polling
        router.push(`/game?game_id=${gameId}&player_id=${playerId}`)
      } else {
        setError(data.error || 'Failed to start game')
      }
    } catch (error: any) {
      setError(error.message || 'Error starting game')
    } finally {
      setLoading(false)
    }
  }

  if (!gameState) {
    return (
      <main style={{ padding: '50px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h1>Loading...</h1>
      </main>
    )
  }

  const isCreator = gameState.creator_id === playerId

  return (
    <main style={{ 
      padding: '50px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '10px' }}>Waiting Room</h1>
      <h2 style={{ marginBottom: '30px', color: '#666', fontWeight: 'normal' }}>
        Game: {gameState.game_name}
      </h2>

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

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>
            Players ({gameState.players.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {gameState.players.map((player) => (
              <li 
                key={player.player_id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>
                  {player.name}
                  {player.is_creator && (
                    <span style={{ 
                      marginLeft: '10px', 
                      fontSize: '12px', 
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      (Creator)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isCreator ? (
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #2196F3'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Start Game</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Number of rounds per player:
            </label>
            <input
              type="number"
              min="1"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              style={{
                padding: '10px',
                fontSize: '16px',
                width: '100px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          <button
            onClick={handleStartGame}
            disabled={loading || gameState.players.length < 2}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              cursor: (loading || gameState.players.length < 2) ? 'not-allowed' : 'pointer',
              backgroundColor: gameState.players.length < 2 ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {gameState.players.length < 2 
              ? 'Waiting for more players...' 
              : loading 
                ? 'Starting...' 
                : 'Start Game'}
          </button>
          {gameState.players.length < 2 && (
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              At least 2 players are needed to start the game.
            </p>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#fff3e0',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
            Waiting for the game creator to start the game...
          </p>
        </div>
      )}
    </main>
  )
}

export default function WaitingRoom() {
  return (
    <Suspense fallback={
      <main style={{ padding: '50px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h1>Loading...</h1>
      </main>
    }>
      <WaitingRoomContent />
    </Suspense>
  )
}

