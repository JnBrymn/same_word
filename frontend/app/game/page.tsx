'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Player {
  name: string
  player_id: string
  score: number
  is_creator: boolean
}

interface TurnInfo {
  turn_id: string
  questioner_id: string
  question: string | null
  phase: string
  is_complete: boolean
  answers: { [player_id: string]: string } | null
  scores: { [player_id: string]: number } | null
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
  current_turn: TurnInfo | null
}

export default function Game() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameId = searchParams.get('game_id')
  const playerId = searchParams.get('player_id')

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
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
        const res = await fetch(`${apiUrl}/games/${gameId}?player_id=${playerId}`)
        if (!res.ok) {
          throw new Error('Failed to fetch game state')
        }
        const data = await res.json()
        setGameState(data)

        // Auto-redirect if game is finished
        if (data.status === 'finished') {
          // Stay on page to show final scores
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

  const handleSubmitQuestion = async () => {
    if (!gameId || !playerId) return

    setError('')
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/games/${gameId}/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          question: question.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Failed to submit question')
      }

      if (data.success) {
        setQuestion('')
        // State will update via polling
      } else {
        setError(data.error || 'Failed to submit question')
      }
    } catch (error: any) {
      setError(error.message || 'Error submitting question')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!gameId || !playerId) return

    setError('')
    const answerTrimmed = answer.trim()
    if (!answerTrimmed) {
      setError('Please enter an answer')
      return
    }

    if (answerTrimmed.includes(' ')) {
      setError('Answer must be a single word')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/games/${gameId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          word: answerTrimmed,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Failed to submit answer')
      }

      if (data.success) {
        setAnswer('')
        // State will update via polling
      } else {
        setError(data.error || 'Failed to submit answer')
      }
    } catch (error: any) {
      setError(error.message || 'Error submitting answer')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNextTurn = async () => {
    if (!gameId) return

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/games/${gameId}/start-turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Failed to start turn')
      }

      // State will update via polling
    } catch (error: any) {
      setError(error.message || 'Error starting turn')
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

  // Game finished
  if (gameState.status === 'finished') {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score)
    const maxScore = sortedPlayers[0]?.score
    const winners = sortedPlayers.filter(p => p.score === maxScore)

    return (
      <main style={{ 
        padding: '50px', 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ marginBottom: '10px' }}>Game Over!</h1>
        <h2 style={{ marginBottom: '30px', color: '#666', fontWeight: 'normal' }}>
          Game: {gameState.game_name}
        </h2>

        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginBottom: '20px' }}>Final Scores</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sortedPlayers.map((player, index) => (
              <li 
                key={player.player_id}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: winners.some(w => w.player_id === player.player_id) ? '2px solid #4CAF50' : 'none'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>
                  {index + 1}. {player.name}
                  {winners.some(w => w.player_id === player.player_id) && (
                    <span style={{ marginLeft: '10px', color: '#4CAF50' }}>🏆 Winner!</span>
                  )}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{player.score} points</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          Return to Home
        </button>
      </main>
    )
  }

  // Get current questioner
  const currentQuestioner = gameState.current_turn_index !== null 
    ? gameState.players[gameState.current_turn_index]
    : null

  const isMyTurn = currentQuestioner?.player_id === playerId
  const currentTurn = gameState.current_turn
  const phase = currentTurn?.phase || 'question'
  const hasAnswered = currentTurn?.answers && playerId && playerId in currentTurn.answers
  const myAnswer = hasAnswered && currentTurn.answers ? currentTurn.answers[playerId] : null

  // Count how many players have answered
  const answeredCount = currentTurn?.answers ? Object.keys(currentTurn.answers).length : 0
  const totalPlayers = gameState.players.length

  return (
    <main style={{ 
      padding: '50px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '10px' }}>Same Word</h1>
      <h2 style={{ marginBottom: '30px', color: '#666', fontWeight: 'normal' }}>
        Game: {gameState.game_name} | Round {gameState.current_round + 1} / {gameState.rounds_per_player}
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

      {/* Scores */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Scores</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {gameState.players.map((player) => (
            <div
              key={player.player_id}
              style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                textAlign: 'center',
                border: player.player_id === playerId ? '2px solid #2196F3' : 'none'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{player.name}</div>
              <div style={{ fontSize: '20px' }}>{player.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Question Phase */}
      {(!currentTurn || phase === 'question') && (
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          {isMyTurn ? (
            <>
              <h3 style={{ marginBottom: '15px' }}>It's your turn to ask a question!</h3>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSubmitQuestion()}
                  placeholder="Enter your question..."
                  disabled={loading}
                  style={{
                    padding: '12px',
                    fontSize: '16px',
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <button
                onClick={handleSubmitQuestion}
                disabled={loading || !question.trim()}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: (loading || !question.trim()) ? 'not-allowed' : 'pointer',
                  backgroundColor: (loading || !question.trim()) ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Question'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3>Waiting for {currentQuestioner?.name} to ask a question...</h3>
            </div>
          )}
        </div>
      )}

      {/* Answer Phase */}
      {currentTurn && phase === 'answer' && currentTurn.question && (
        <div style={{
          backgroundColor: '#fff3e0',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>
            Question: <span style={{ fontStyle: 'italic' }}>"{currentTurn.question}"</span>
          </h3>
          <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
            Asked by: {gameState.players.find(p => p.player_id === currentTurn.questioner_id)?.name}
          </p>

          {hasAnswered ? (
            <div style={{
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '18px' }}>
                You answered: <strong>{myAnswer}</strong>
              </p>
              <p style={{ margin: '10px 0 0 0', color: '#666' }}>
                Waiting for other players... ({answeredCount} / {totalPlayers} answered)
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSubmitAnswer()}
                  placeholder="Enter a single word answer..."
                  disabled={loading}
                  style={{
                    padding: '12px',
                    fontSize: '16px',
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <button
                onClick={handleSubmitAnswer}
                disabled={loading || !answer.trim()}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: (loading || !answer.trim()) ? 'not-allowed' : 'pointer',
                  backgroundColor: (loading || !answer.trim()) ? '#ccc' : '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Answer'}
              </button>
              <p style={{ marginTop: '10px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                {answeredCount} / {totalPlayers} players have answered
              </p>
            </>
          )}
        </div>
      )}

      {/* Scoring Phase */}
      {currentTurn && (phase === 'scoring' || currentTurn.is_complete) && currentTurn.answers && currentTurn.scores && (
        <div style={{
          backgroundColor: '#e8f5e9',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>
            Question: <span style={{ fontStyle: 'italic' }}>"{currentTurn.question}"</span>
          </h3>

          {/* Group answers by word */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Answers:</h4>
            {Object.entries(currentTurn.answers).map(([pid, word]) => {
              const player = gameState.players.find(p => p.player_id === pid)
              return (
                <div
                  key={pid}
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
                    <strong>{player?.name}</strong>: {word}
                  </span>
                  <span style={{
                    fontWeight: 'bold',
                    color: (currentTurn.scores[pid] || 0) > 0 ? '#4CAF50' : (currentTurn.scores[pid] || 0) < 0 ? '#c62828' : '#666'
                  }}>
                    {currentTurn.scores[pid] > 0 ? '+' : ''}{currentTurn.scores[pid]} points
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '4px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              Turn Complete!
            </p>
            {currentTurn.scores[playerId || ''] !== undefined && (
              <p style={{ margin: '10px 0 0 0', fontSize: '16px' }}>
                You earned: <strong style={{
                  color: (currentTurn.scores[playerId || ''] || 0) > 0 ? '#4CAF50' : (currentTurn.scores[playerId || ''] || 0) < 0 ? '#c62828' : '#666'
                }}>
                  {currentTurn.scores[playerId || ''] > 0 ? '+' : ''}{currentTurn.scores[playerId || '']} points
                </strong>
              </p>
            )}
          </div>

          {gameState.status === 'playing' && (
            <button
              onClick={handleStartNextTurn}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              {loading ? 'Starting...' : 'Next Turn'}
            </button>
          )}
        </div>
      )}
    </main>
  )
}
