import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Turn from '@/app/game/Turn'

const mockPlayers = [
  { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
  { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
  { name: 'Player 3', player_id: 'player3', score: 0, is_creator: false },
]

describe('Turn Component', () => {
  describe('Question Phase', () => {
    it('shows question input for questioner', () => {
      const onQuestionChange = jest.fn()
      const onQuestionSubmit = jest.fn()

      render(
        <Turn
          turn={null}
          players={mockPlayers}
          currentPlayerId="player1"
          previousScores={{}}
          isCurrentTurn={true}
          isQuestionPhase={true}
          currentQuestioner={mockPlayers[0]}
          onQuestionChange={onQuestionChange}
          onQuestionSubmit={onQuestionSubmit}
          question=""
        />
      )

      expect(screen.getByPlaceholderText(/enter your question/i)).toBeInTheDocument()
      expect(screen.getByText(/it's your turn to ask a question/i)).toBeInTheDocument()
    })

    it('shows waiting message for non-questioners', () => {
      render(
        <Turn
          turn={null}
          players={mockPlayers}
          currentPlayerId="player2"
          previousScores={{}}
          isCurrentTurn={true}
          isQuestionPhase={true}
          currentQuestioner={mockPlayers[0]}
        />
      )

      expect(screen.getByText(/waiting for player 1 to ask a question/i)).toBeInTheDocument()
      expect(screen.queryByPlaceholderText(/enter your question/i)).not.toBeInTheDocument()
    })

    it('calls onQuestionSubmit when question is submitted', async () => {
      const user = userEvent.setup()
      const onQuestionSubmit = jest.fn()

      render(
        <Turn
          turn={null}
          players={mockPlayers}
          currentPlayerId="player1"
          previousScores={{}}
          isCurrentTurn={true}
          isQuestionPhase={true}
          currentQuestioner={mockPlayers[0]}
          onQuestionChange={jest.fn()}
          onQuestionSubmit={onQuestionSubmit}
          question="Test question"
        />
      )

      const submitButton = screen.getByRole('button', { name: /submit question/i })
      await user.click(submitButton)

      expect(onQuestionSubmit).toHaveBeenCalledWith('Test question')
    })
  })

  describe('Answer Phase', () => {
    const mockTurn = {
      turn_id: 'turn1',
      questioner_id: 'player1',
      question: 'What is your favorite color?',
      phase: 'answer',
      is_complete: false,
      answers: {},
      scores: null,
      typing_players: null,
    }

    it('shows answer input when it is current turn and player has not answered', () => {
      const onAnswerChange = jest.fn()
      const onAnswerSubmit = jest.fn()

      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player2"
          previousScores={{}}
          isCurrentTurn={true}
          onAnswerChange={onAnswerChange}
          onAnswerSubmit={onAnswerSubmit}
          answer=""
          hasAnswered={false}
        />
      )

      expect(screen.getByPlaceholderText(/enter a single word answer/i)).toBeInTheDocument()
      expect(screen.getByText(/enter your answer/i)).toBeInTheDocument()
    })

    it('does not show answer input when player has already answered', () => {
      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player2"
          previousScores={{}}
          isCurrentTurn={true}
          hasAnswered={true}
        />
      )

      expect(screen.queryByPlaceholderText(/enter a single word answer/i)).not.toBeInTheDocument()
    })

    it('shows answer count during answer phase', () => {
      const turnWithAnswers = {
        ...mockTurn,
        answers: { player1: 'blue', player2: 'red' },
      }

      render(
        <Turn
          turn={turnWithAnswers}
          players={mockPlayers}
          currentPlayerId="player3"
          previousScores={{}}
          isCurrentTurn={true}
        />
      )

      expect(screen.getByText(/2 \/ 3 players have answered/i)).toBeInTheDocument()
    })

    it('calls onAnswerSubmit when answer is submitted', async () => {
      const user = userEvent.setup()
      const onAnswerSubmit = jest.fn()

      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player2"
          previousScores={{}}
          isCurrentTurn={true}
          onAnswerChange={jest.fn()}
          onAnswerSubmit={onAnswerSubmit}
          answer="blue"
          hasAnswered={false}
        />
      )

      const submitButton = screen.getByRole('button', { name: /submit answer/i })
      await user.click(submitButton)

      expect(onAnswerSubmit).toHaveBeenCalledWith('blue')
    })
  })

  describe('Scoring Phase', () => {
    const mockTurn = {
      turn_id: 'turn1',
      questioner_id: 'player1',
      question: 'What is your favorite color?',
      phase: 'scoring',
      is_complete: true,
      answers: {
        player1: 'blue',
        player2: 'blue',
        player3: 'red',
      },
      scores: {
        player1: 2,
        player2: 1,
        player3: 0,
      },
      typing_players: null,
    }

    it('shows all answers when in scoring phase', () => {
      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player1"
          previousScores={{}}
          isCurrentTurn={true}
        />
      )

      // Multiple players can have the same answer, so use getAllByText
      const blueAnswers = screen.getAllByText('blue')
      expect(blueAnswers.length).toBeGreaterThan(0)
      expect(screen.getByText('red')).toBeInTheDocument()
    })

    it('shows scores for each player', () => {
      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player1"
          previousScores={{}}
          isCurrentTurn={true}
        />
      )

      // Scores should be displayed
      expect(screen.getByText('+2')).toBeInTheDocument()
      expect(screen.getByText('+1')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('shows next turn button when turn is complete', () => {
      const onNextTurn = jest.fn()

      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player1"
          previousScores={{}}
          isCurrentTurn={true}
          onNextTurn={onNextTurn}
        />
      )

      expect(screen.getByRole('button', { name: /next turn/i })).toBeInTheDocument()
    })

    it('calls onNextTurn when next turn button is clicked', async () => {
      const user = userEvent.setup()
      const onNextTurn = jest.fn()

      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player1"
          previousScores={{}}
          isCurrentTurn={true}
          onNextTurn={onNextTurn}
        />
      )

      const nextTurnButton = screen.getByRole('button', { name: /next turn/i })
      await user.click(nextTurnButton)

      expect(onNextTurn).toHaveBeenCalled()
    })
  })

  describe('Question Display', () => {
    const mockTurn = {
      turn_id: 'turn1',
      questioner_id: 'player1',
      question: 'What is your favorite color?',
      phase: 'answer',
      is_complete: false,
      answers: {},
      scores: null,
      typing_players: null,
    }

    it('displays the question and questioner name', () => {
      render(
        <Turn
          turn={mockTurn}
          players={mockPlayers}
          currentPlayerId="player2"
          previousScores={{}}
          isCurrentTurn={true}
        />
      )

      // Question text includes quotes, so match with a function
      expect(screen.getByText((content, element) => {
        return element?.textContent === '"What is your favorite color?"' || 
               content.includes('What is your favorite color?')
      })).toBeInTheDocument()
      expect(screen.getByText(/question asked by: player 1/i)).toBeInTheDocument()
    })
  })
})

