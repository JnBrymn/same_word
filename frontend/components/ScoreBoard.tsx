interface Player {
  name: string
  player_id: string
  score: number
}

interface ScoreBoardProps {
  players: Player[]
  currentPlayerId: string | null
}

export default function ScoreBoard({ players, currentPlayerId }: ScoreBoardProps) {
  if (!players || !Array.isArray(players)) {
    return null
  }
  
  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px'
    }}>
      <h3 style={{ marginBottom: '15px' }}>Scores</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        {players.map((player) => (
          <div
            key={player.player_id}
            style={{
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '4px',
              textAlign: 'center',
              border: player.player_id === currentPlayerId ? '2px solid #2196F3' : 'none'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{player.name}</div>
            <div style={{ fontSize: '20px' }}>{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

