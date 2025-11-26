import { render, screen } from '@testing-library/react'
import ScoreBoard from '@/components/ScoreBoard'

describe('ScoreBoard', () => {
  const mockPlayers = [
    { name: 'Player 1', player_id: 'player1', score: 10 },
    { name: 'Player 2', player_id: 'player2', score: 15 },
    { name: 'Player 3', player_id: 'player3', score: 8 },
  ]

  it('renders all players with their scores', () => {
    render(<ScoreBoard players={mockPlayers} currentPlayerId={null} />)
    
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Player 2')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Player 3')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('highlights current player', () => {
    render(<ScoreBoard players={mockPlayers} currentPlayerId="player2" />)
    
    // Current player should have the highlight border
    const player2Card = screen.getByText('Player 2').closest('div')
    expect(player2Card).toHaveStyle({ border: expect.stringContaining('2px solid') })
    expect(player2Card).toHaveStyle({ border: expect.stringContaining('#2196F3') })
  })

  it('displays scores correctly', () => {
    render(<ScoreBoard players={mockPlayers} currentPlayerId={null} />)
    
    // Check that scores are displayed
    const scores = mockPlayers.map(p => screen.getByText(p.score.toString()))
    scores.forEach(score => expect(score).toBeInTheDocument())
  })
})

