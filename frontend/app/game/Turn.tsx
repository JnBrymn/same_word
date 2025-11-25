'use client'

import React from 'react'

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

interface TurnProps {
  turn: TurnInfo | null
  players: Player[]
  currentPlayerId: string | null
  previousScores: { [player_id: string]: number }
  isCurrentTurn: boolean
  isQuestionPhase?: boolean
  currentQuestioner?: Player | null
  onQuestionSubmit?: (question: string) => void
  question?: string
  onQuestionChange?: (question: string) => void
  loading?: boolean
  onAnswerSubmit?: (answer: string) => void
  answer?: string
  onAnswerChange?: (answer: string) => void
  hasAnswered?: boolean
  onNextTurn?: () => void
}

export default function Turn({
  turn,
  players,
  currentPlayerId,
  previousScores,
  isCurrentTurn,
  isQuestionPhase = false,
  currentQuestioner,
  onQuestionSubmit,
  question = '',
  onQuestionChange,
  loading = false,
  onAnswerSubmit,
  answer = '',
  onAnswerChange,
  hasAnswered = false,
  onNextTurn
}: TurnProps) {
  // Handle question phase (no turn object yet)
  if (isQuestionPhase && !turn) {
    const isMyTurn = currentQuestioner?.player_id === currentPlayerId
    return (
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '15px',
        border: '2px solid #2196F3'
      }}>
        {isMyTurn ? (
          <>
            <h4 style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>
              It's your turn to ask a question!
            </h4>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                value={question}
                onChange={(e) => onQuestionChange?.(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && question.trim() && onQuestionSubmit?.(question.trim())}
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
              onClick={() => question.trim() && onQuestionSubmit?.(question.trim())}
              disabled={loading || !question.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
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
          <div style={{ textAlign: 'center', color: '#666' }}>
            <h4 style={{ marginBottom: '5px', fontSize: '14px' }}>
              Waiting for {currentQuestioner?.name} to ask a question...
            </h4>
          </div>
        )}
      </div>
    )
  }

  if (!turn) return null
  const answeredCount = turn.answers ? Object.keys(turn.answers).length : 0
  const totalPlayers = players.length
  const allAnswered = answeredCount === totalPlayers
  const showAnswers = turn.phase === 'scoring' || turn.is_complete || allAnswered

  return (
    <div style={{
      backgroundColor: isCurrentTurn ? '#fff3e0' : '#f5f5f5',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '15px',
      border: isCurrentTurn ? '2px solid #FF9800' : '1px solid #ddd'
    }}>
      {/* Question */}
      {turn.question && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ marginBottom: '5px', color: '#666', fontSize: '14px' }}>
            Question asked by: {players.find(p => p.player_id === turn.questioner_id)?.name}
          </h4>
          <p style={{ 
            fontSize: '18px', 
            fontStyle: 'italic',
            fontWeight: 'bold',
            margin: 0
          }}>
            "{turn.question}"
          </p>
        </div>
      )}

      {/* Answers */}
      <div style={{ marginBottom: '15px' }}>
        <h5 style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>Answers:</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {players.map((player) => {
            const hasAnswered = turn.answers && player.player_id in turn.answers
            const answer = turn.answers && player.player_id in turn.answers 
              ? turn.answers[player.player_id] 
              : null
            const isTyping = turn.typing_players && player.player_id in turn.typing_players && !hasAnswered
            const score = turn.scores && player.player_id in turn.scores 
              ? turn.scores[player.player_id] 
              : null
            const previousScore = previousScores[player.player_id] ?? 0
            const delta = score !== null ? score : null

            return (
              <div
                key={player.player_id}
                style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: player.player_id === currentPlayerId ? '2px solid #2196F3' : '1px solid #e0e0e0'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {player.name}
                  </div>
                  <div style={{ 
                    color: hasAnswered ? '#4CAF50' : isTyping ? '#FF9800' : '#999',
                    fontStyle: hasAnswered ? 'normal' : 'italic',
                    fontSize: '14px'
                  }}>
                    {hasAnswered && showAnswers && answer && answer !== 'answered' ? (
                      <strong>{answer}</strong>
                    ) : hasAnswered ? (
                      '✓ Answered'
                    ) : isTyping ? (
                      '✎ Typing...'
                    ) : (
                      'Waiting...'
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  {turn.scores && turn.scores[player.player_id] !== undefined ? (
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: turn.scores[player.player_id] > 0 ? '#4CAF50' : turn.scores[player.player_id] < 0 ? '#c62828' : '#666'
                    }}>
                      {turn.scores[player.player_id] > 0 ? '+' : ''}{turn.scores[player.player_id]}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Answer count during answer phase */}
      {turn.phase === 'answer' && !allAnswered && (
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          padding: '10px',
          backgroundColor: 'white',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          {answeredCount} / {totalPlayers} players have answered
        </div>
      )}

      {/* Answer input for current player during answer phase */}
      {turn.phase === 'answer' && isCurrentTurn && !hasAnswered && onAnswerSubmit && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '2px solid #FF9800'
        }}>
          <h5 style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
            Enter your answer:
          </h5>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange?.(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && answer.trim() && onAnswerSubmit(answer.trim())}
              placeholder="Enter a single word answer..."
              disabled={loading}
              style={{
                padding: '10px',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          <button
            onClick={() => answer.trim() && onAnswerSubmit(answer.trim())}
            disabled={loading || !answer.trim()}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
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
        </div>
      )}

      {/* Next Turn Button - Only show when turn is complete */}
      {turn.is_complete && isCurrentTurn && onNextTurn && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <button
            onClick={onNextTurn}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Starting...' : 'Next Turn'}
          </button>
        </div>
      )}
    </div>
  )
}

