import { render, screen } from '@testing-library/react'
import PlayerCard from '@/components/PlayerCard'

describe('PlayerCard', () => {
  const mockPlayer = {
    name: 'Test Player',
    player_id: 'player1',
    is_creator: false,
  }

  describe('waiting-room variant', () => {
    it('renders player name', () => {
      render(<PlayerCard player={mockPlayer} variant="waiting-room" />)
      expect(screen.getByText('Test Player')).toBeInTheDocument()
    })

    it('shows creator badge when player is creator', () => {
      const creatorPlayer = { ...mockPlayer, is_creator: true }
      render(<PlayerCard player={creatorPlayer} variant="waiting-room" />)
      expect(screen.getByText('(Creator)')).toBeInTheDocument()
    })

    it('does not show creator badge when player is not creator', () => {
      render(<PlayerCard player={mockPlayer} variant="waiting-room" />)
      expect(screen.queryByText('(Creator)')).not.toBeInTheDocument()
    })
  })

  describe('score variant', () => {
    it('renders player name and score', () => {
      render(<PlayerCard player={mockPlayer} variant="score" score={42} />)
      expect(screen.getByText('Test Player')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('highlights current player', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          variant="score"
          score={42}
          currentPlayerId="player1"
        />
      )
      const card = screen.getByText('Test Player').closest('div')
      expect(card).toHaveStyle({ border: expect.stringContaining('2px solid') })
    })
  })

  describe('answer-status variant', () => {
    it('shows waiting state when player has not answered', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          variant="answer-status"
          hasAnswered={false}
        />
      )
      expect(screen.getByText('Waiting...')).toBeInTheDocument()
    })

    it('shows answered state when player has answered', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          variant="answer-status"
          hasAnswered={true}
        />
      )
      expect(screen.getByText('✓ Answered')).toBeInTheDocument()
    })

    it('shows typing indicator when player is typing', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          variant="answer-status"
          hasAnswered={false}
          isTyping={true}
        />
      )
      expect(screen.getByText('✎ Typing...')).toBeInTheDocument()
    })

    it('shows answer when showAnswers is true', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          variant="answer-status"
          hasAnswered={true}
          answer="testword"
          showAnswers={true}
        />
      )
      expect(screen.getByText('testword')).toBeInTheDocument()
    })

    it('shows turn score when provided', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          variant="answer-status"
          hasAnswered={true}
          turnScore={5}
        />
      )
      expect(screen.getByText('+5')).toBeInTheDocument()
    })

    it('highlights current player', () => {
      render(
        <PlayerCard
          player={mockPlayer}
          variant="answer-status"
          currentPlayerId="player1"
        />
      )
      const card = screen.getByText('Test Player').closest('div')
      expect(card).toHaveStyle({ border: expect.stringContaining('2px solid') })
    })
  })
})

