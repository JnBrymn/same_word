'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Turn from './Turn'
import ErrorMessage from '@/components/ErrorMessage'
import ScoreBoard from '@/components/ScoreBoard'

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
  typing_players: { [player_id: string]: number } | null
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
  all_turns: TurnInfo[]
}

function GameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameId = searchParams.get('game_id')
  const playerId = searchParams.get('player_id')

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [previousScores, setPreviousScores] = useState<{ [player_id: string]: number }>({})
  const [turnScoresBefore, setTurnScoresBefore] = useState<{ [turn_id: string]: { [player_id: string]: number } }>({})
  const mainRef = useRef<HTMLDivElement>(null)

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
        
        // Track scores before each turn completes
        if (data.all_turns) {
          // Initialize scores before for all turns that have scores
          const newScoresBefore: { [turn_id: string]: { [player_id: string]: number } } = {}
          
          // Calculate scores before each turn by working backwards from current scores
          let runningScores: { [player_id: string]: number } = {}
          data.players.forEach((player: Player) => {
            runningScores[player.player_id] = player.score
          })
          
          // Go through turns in reverse order to calculate scores before each turn
          for (let i = data.all_turns.length - 1; i >= 0; i--) {
            const turn = data.all_turns[i]
            if (turn.scores) {
              // Store scores before this turn
              newScoresBefore[turn.turn_id] = { ...runningScores }
              // Subtract this turn's scores to get scores before this turn
              data.players.forEach((player: Player) => {
                const turnScore = turn.scores?.[player.player_id] || 0
                runningScores[player.player_id] = runningScores[player.player_id] - turnScore
              })
            }
          }
          
          setTurnScoresBefore(newScoresBefore)
        }
        
        setGameState(data)
        
        // Auto-scroll to top when new turn appears
        if (data.all_turns) {
          const shouldScroll = !gameState?.all_turns || data.all_turns.length > gameState.all_turns.length
          if (shouldScroll) {
            setTimeout(() => {
              if (mainRef.current) {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }, 100)
          }
        }
      } catch (error) {
        console.error('Error fetching game state:', error)
      }
    }

    // Initial fetch
    fetchGameState()

    // Poll every 1.5 seconds
    const interval = setInterval(fetchGameState, 1500)

    return () => {
      clearInterval(interval)
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [gameId, playerId, router, apiUrl, gameState])

  // Scroll to top on initial load
  useEffect(() => {
    if (gameState?.all_turns) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 200)
    }
  }, [gameState?.all_turns?.length])

  const handleSubmitQuestion = async (questionText?: string) => {
    if (!gameId || !playerId) return

    const questionToSubmit = questionText !== undefined ? questionText : question
    setError('')
    if (!questionToSubmit.trim()) {
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
          question: questionToSubmit.trim(),
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

  const sendTypingIndicator = async () => {
    if (!gameId || !playerId) return
    
    try {
      await fetch(`${apiUrl}/games/${gameId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
        }),
      })
    } catch (error) {
      // Silently fail - typing indicator is not critical
      console.error('Error sending typing indicator:', error)
    }
  }

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value)
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    // Send typing indicator immediately
    sendTypingIndicator()
    
    // Set timeout to send again after 1 second if still typing
    const timeout = setTimeout(() => {
      sendTypingIndicator()
    }, 1000)
    
    setTypingTimeout(timeout)
  }

  const handleSubmitAnswer = async (answerText?: string) => {
    if (!gameId || !playerId) return

    // Clear typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      setTypingTimeout(null)
    }

    const answerToSubmit = answerText !== undefined ? answerText : answer
    setError('')
    const answerTrimmed = answerToSubmit.trim()
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
    const reversedTurns = gameState.all_turns ? [...gameState.all_turns].reverse() : []

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

        {/* Final Scores */}
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

        {/* Turn History - Show all turns so players can review */}
        {reversedTurns.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px', color: '#666' }}>Game History</h2>
            <p style={{ marginBottom: '20px', color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
              Scroll through to see how the game evolved
            </p>
            {reversedTurns.map((turn) => {
              const scoresBefore = turnScoresBefore[turn.turn_id] || {}
              
              return (
                <Turn
                  key={turn.turn_id}
                  turn={turn}
                  players={gameState.players}
                  currentPlayerId={playerId}
                  previousScores={scoresBefore}
                  isCurrentTurn={false}
                />
              )
            })}
          </div>
        )}

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
    && gameState.current_turn_index >= 0 
    && gameState.current_turn_index < gameState.players.length
    ? gameState.players[gameState.current_turn_index]
    : null

  const isMyTurn = currentQuestioner?.player_id === playerId
  const currentTurn = gameState.current_turn
  const phase = currentTurn?.phase || 'question'
  const currentTurnHasAnswered = !!(currentTurn?.answers && playerId && currentTurn.answers && typeof currentTurn.answers === 'object' && playerId in currentTurn.answers)
  const myAnswer = currentTurnHasAnswered && currentTurn?.answers && typeof currentTurn.answers === 'object' ? currentTurn.answers[playerId] : null

  // Count how many players have answered
  const answeredCount = currentTurn?.answers && typeof currentTurn.answers === 'object' ? Object.keys(currentTurn.answers).length : 0
  const totalPlayers = gameState.players?.length || 0

  // Reverse turns to show newest first
  const reversedTurns = gameState.all_turns ? [...gameState.all_turns].reverse() : []
  
  // Include current turn if it exists and isn't already in all_turns
  const turnsToRender = [...reversedTurns]
  if (currentTurn && !reversedTurns.some(t => t.turn_id === currentTurn.turn_id)) {
    turnsToRender.unshift(currentTurn)
  }

  return (
    <main ref={mainRef} style={{ 
      padding: '50px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '10px' }}>Same Word</h1>
      <h2 style={{ marginBottom: '30px', color: '#666', fontWeight: 'normal' }}>
        Game: {gameState.game_name} | Round {gameState.current_round + 1} / {gameState.rounds_per_player}
      </h2>

      {error && <ErrorMessage message={error} />}

      <ScoreBoard players={gameState.players} currentPlayerId={playerId} />

      {/* Question Phase - Show at top if no current turn */}
      {(!currentTurn || phase === 'question') && (
        <Turn
          turn={null}
          players={gameState.players}
          currentPlayerId={playerId}
          previousScores={{}}
          isCurrentTurn={true}
          isQuestionPhase={true}
          currentQuestioner={currentQuestioner}
          onQuestionSubmit={handleSubmitQuestion}
          question={question}
          onQuestionChange={setQuestion}
          loading={loading}
        />
      )}

      {/* All Turns - Newest at top */}
      {turnsToRender.map((turn) => {
        const isCurrentTurnItem = turn.turn_id === currentTurn?.turn_id
        const scoresBefore = turnScoresBefore[turn.turn_id] || {}
        const turnHasAnswered = !!(turn.answers && playerId && turn.answers && typeof turn.answers === 'object' && playerId in turn.answers)
        
        return (
          <Turn
            key={turn.turn_id}
            turn={turn}
            players={gameState.players}
            currentPlayerId={playerId}
            previousScores={scoresBefore}
            isCurrentTurn={isCurrentTurnItem}
            onAnswerSubmit={handleSubmitAnswer}
            answer={answer}
            onAnswerChange={setAnswer}
            hasAnswered={turnHasAnswered}
            loading={loading}
            onNextTurn={gameState.status === 'playing' ? handleStartNextTurn : undefined}
          />
        )
      })}
    </main>
  )
}

export default function Game() {
  return (
    <Suspense fallback={
      <main style={{ padding: '50px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h1>Loading...</h1>
      </main>
    }>
      <GameContent />
    </Suspense>
  )
}
