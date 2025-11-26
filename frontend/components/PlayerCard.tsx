interface PlayerCardProps {
  player: {
    name: string
    player_id: string
    is_creator?: boolean
  }
  currentPlayerId?: string | null
  variant?: 'waiting-room' | 'score' | 'answer-status'
  score?: number
  answer?: string | null
  hasAnswered?: boolean
  isTyping?: boolean | null
  showAnswers?: boolean | null
  turnScore?: number | null
}

export default function PlayerCard({
  player,
  currentPlayerId,
  variant = 'waiting-room',
  score,
  answer,
  hasAnswered,
  isTyping,
  showAnswers,
  turnScore
}: PlayerCardProps) {
  // Waiting room variant: name + creator badge
  if (variant === 'waiting-room') {
    return (
      <li 
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
    )
  }

  // Score variant: name + score (for score board)
  if (variant === 'score') {
    return (
      <div
        style={{
          padding: '10px',
          backgroundColor: 'white',
          borderRadius: '4px',
          textAlign: 'center',
          border: player.player_id === currentPlayerId ? '2px solid #2196F3' : 'none'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{player.name}</div>
        <div style={{ fontSize: '20px' }}>{score ?? 0}</div>
      </div>
    )
  }

  // Answer status variant: name + answer/status (for turn answers)
  if (variant === 'answer-status') {
    return (
      <div
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
          {turnScore !== undefined && turnScore !== null ? (
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: turnScore > 0 ? '#4CAF50' : turnScore < 0 ? '#c62828' : '#666'
            }}>
              {turnScore > 0 ? '+' : ''}{turnScore}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return null
}

