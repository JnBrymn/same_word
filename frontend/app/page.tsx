'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import HowToPlayButton from '@/components/HowToPlayButton'
import ErrorMessage from '@/components/ErrorMessage'

interface GameListItem {
  game_name: string
  game_id: string
  player_count: number
}

export default function Home() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [createGameName, setCreateGameName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [availableGames, setAvailableGames] = useState<GameListItem[]>([])
  const [loadingGames, setLoadingGames] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  // Fetch available games
  const fetchAvailableGames = useCallback(async () => {
    setLoadingGames(true)
    try {
      const res = await fetch(`${apiUrl}/games`)
      if (res.ok) {
        const games = await res.json()
        setAvailableGames(games)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoadingGames(false)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchAvailableGames()
    // Refresh the list every 5 seconds
    const interval = setInterval(fetchAvailableGames, 5000)
    return () => clearInterval(interval)
  }, [fetchAvailableGames])

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
        // Refresh the games list after creating
        fetchAvailableGames()
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

  const handleJoinGame = async (gameName: string) => {
    setError('')
    
    // Validation
    if (!playerName.trim()) {
      setError('Please enter your name')
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
          game_name: gameName.toLowerCase(),
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
      
      <HowToPlayButton />
      
      {error && <ErrorMessage message={error} />}

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

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Join a game:
        </label>
        {loadingGames ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Loading games...
          </div>
        ) : availableGames.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            No games available. Create a new game to get started!
          </div>
        ) : (
          <div style={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {availableGames.map((game) => (
              <button
                key={game.game_id}
                onClick={() => handleJoinGame(game.game_name)}
                disabled={loading || !playerName.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  textAlign: 'left',
                  cursor: loading || !playerName.trim() ? 'not-allowed' : 'pointer',
                  backgroundColor: 'white',
                  color: '#333',
                  border: 'none',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && playerName.trim()) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{game.game_name}</span>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {game.player_count} {game.player_count === 1 ? 'player' : 'players'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

