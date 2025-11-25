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

interface TurnHistoryProps {
  turn: TurnInfo
  players: Player[]
  currentPlayerId: string | null
  previousScores: { [player_id: string]: number }
  isCurrentTurn: boolean
}

export default function TurnHistory({
  turn,
  players,
  currentPlayerId,
  previousScores,
  isCurrentTurn
}: TurnHistoryProps) {
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
                  {delta !== null && (
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: delta > 0 ? '#4CAF50' : delta < 0 ? '#c62828' : '#666',
                      marginBottom: '2px'
                    }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </div>
                  )}
                  {score !== null && (
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {previousScore + (delta || 0)}
                    </div>
                  )}
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
          borderRadius: '4px'
        }}>
          {answeredCount} / {totalPlayers} players have answered
        </div>
      )}
    </div>
  )
}

