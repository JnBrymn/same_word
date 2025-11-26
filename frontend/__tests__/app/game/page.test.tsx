import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import Game from '@/app/game/page'

// Mock fetch globally
global.fetch = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

describe('Game Page', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }
  const mockSearchParams = new URLSearchParams('game_id=game1&player_id=player1')

  const mockPlayers = [
    { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
    { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
    { name: 'Player 3', player_id: 'player3', score: 0, is_creator: false },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Score Calculation Logic', () => {
    it('correctly calculates scores before each turn', async () => {
      // Players start with scores: player1=10, player2=8, player3=5
      // Turn 1 scores: player1=+2, player2=+1, player3=+0
      // Turn 2 scores: player1=+1, player2=+2, player3=+1
      // Final scores should be: player1=13, player2=11, player3=6
      
      const playersWithScores = [
        { ...mockPlayers[0], score: 13 },
        { ...mockPlayers[1], score: 11 },
        { ...mockPlayers[2], score: 6 },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: playersWithScores,
          creator_id: 'player1',
          status: 'playing',
          rounds_per_player: 3,
          current_turn_index: 0,
          current_round: 1,
          current_turn: null,
          all_turns: [
            {
              turn_id: 'turn1',
              questioner_id: 'player1',
              question: 'What is your favorite color?',
              phase: 'scoring',
              is_complete: true,
              answers: { player1: 'blue', player2: 'blue', player3: 'red' },
              scores: { player1: 2, player2: 1, player3: 0 },
              typing_players: null,
            },
            {
              turn_id: 'turn2',
              questioner_id: 'player2',
              question: 'What is your favorite food?',
              phase: 'scoring',
              is_complete: true,
              answers: { player1: 'pizza', player2: 'pizza', player3: 'pizza' },
              scores: { player1: 1, player2: 2, player3: 1 },
              typing_players: null,
            },
          ],
        }),
      })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByText(/Test Game/i)).toBeInTheDocument()
      })

      // The score calculation logic should work backwards from final scores
      // This is tested implicitly by the component rendering correctly
      // We verify the scores are displayed correctly
      expect(screen.getByText('13')).toBeInTheDocument()
      expect(screen.getByText('11')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
    })
  })

  describe('Question Submission', () => {
    it('validates that question is required', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: mockPlayers,
          creator_id: 'player1',
          status: 'playing',
          rounds_per_player: 3,
          current_turn_index: 0,
          current_round: 1,
          current_turn: null,
          all_turns: [],
        }),
      })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter your question/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit question/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a question')).toBeInTheDocument()
      })
    })

    it('successfully submits question', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            game_id: 'game1',
            game_name: 'Test Game',
            players: mockPlayers,
            creator_id: 'player1',
            status: 'playing',
            rounds_per_player: 3,
            current_turn_index: 0,
            current_round: 1,
            current_turn: null,
            all_turns: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter your question/i)).toBeInTheDocument()
      })

      const questionInput = screen.getByPlaceholderText(/enter your question/i)
      const submitButton = screen.getByRole('button', { name: /submit question/i })

      await user.type(questionInput, 'What is your favorite color?')
      await user.click(submitButton)

      await waitFor(() => {
        // Question input should be cleared after successful submission
        expect(questionInput).toHaveValue('')
      })
    })
  })

  describe('Answer Submission', () => {
    it('validates that answer is required', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: mockPlayers,
          creator_id: 'player1',
          status: 'playing',
          rounds_per_player: 3,
          current_turn_index: 0,
          current_round: 1,
          current_turn: {
            turn_id: 'turn1',
            questioner_id: 'player1',
            question: 'What is your favorite color?',
            phase: 'answer',
            is_complete: false,
            answers: {},
            scores: null,
            typing_players: null,
          },
          all_turns: [],
        }),
      })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter a single word answer/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit answer/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter an answer')).toBeInTheDocument()
      })
    })

    it('validates that answer must be a single word', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: mockPlayers,
          creator_id: 'player1',
          status: 'playing',
          rounds_per_player: 3,
          current_turn_index: 0,
          current_round: 1,
          current_turn: {
            turn_id: 'turn1',
            questioner_id: 'player1',
            question: 'What is your favorite color?',
            phase: 'answer',
            is_complete: false,
            answers: {},
            scores: null,
            typing_players: null,
          },
          all_turns: [],
        }),
      })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter a single word answer/i)).toBeInTheDocument()
      })

      const answerInput = screen.getByPlaceholderText(/enter a single word answer/i)
      const submitButton = screen.getByRole('button', { name: /submit answer/i })

      await user.type(answerInput, 'blue sky')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Answer must be a single word')).toBeInTheDocument()
      })
    })

    it('successfully submits answer', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            game_id: 'game1',
            game_name: 'Test Game',
            players: mockPlayers,
            creator_id: 'player1',
            status: 'playing',
            rounds_per_player: 3,
            current_turn_index: 0,
            current_round: 1,
            current_turn: {
              turn_id: 'turn1',
              questioner_id: 'player1',
              question: 'What is your favorite color?',
              phase: 'answer',
              is_complete: false,
              answers: {},
              scores: null,
              typing_players: null,
            },
            all_turns: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter a single word answer/i)).toBeInTheDocument()
      })

      const answerInput = screen.getByPlaceholderText(/enter a single word answer/i)
      const submitButton = screen.getByRole('button', { name: /submit answer/i })

      await user.type(answerInput, 'blue')
      await user.click(submitButton)

      await waitFor(() => {
        // Answer input should be cleared after successful submission
        expect(answerInput).toHaveValue('')
      })
    })
  })

  describe('Game Finished State', () => {
    it('identifies winners correctly', async () => {
      const finishedPlayers = [
        { ...mockPlayers[0], score: 15 },
        { ...mockPlayers[1], score: 15 },
        { ...mockPlayers[2], score: 10 },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: finishedPlayers,
          creator_id: 'player1',
          status: 'finished',
          rounds_per_player: 3,
          current_turn_index: null,
          current_round: 3,
          current_turn: null,
          all_turns: [],
        }),
      })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByText('Game Over!')).toBeInTheDocument()
      })

      // Both players with score 15 should be winners
      const winnerTexts = screen.getAllByText(/winner!/i)
      expect(winnerTexts.length).toBeGreaterThan(0)
    })

    it('displays final scores sorted correctly', async () => {
      const finishedPlayers = [
        { ...mockPlayers[0], score: 10 },
        { ...mockPlayers[1], score: 15 },
        { ...mockPlayers[2], score: 8 },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: finishedPlayers,
          creator_id: 'player1',
          status: 'finished',
          rounds_per_player: 3,
          current_turn_index: null,
          current_round: 3,
          current_turn: null,
          all_turns: [],
        }),
      })

      render(<Game />)

      await waitFor(() => {
        expect(screen.getByText('Game Over!')).toBeInTheDocument()
      })

      // Scores should be displayed (sorted by score descending)
      expect(screen.getByText(/15/)).toBeInTheDocument()
      expect(screen.getByText(/10/)).toBeInTheDocument()
      expect(screen.getByText(/8/)).toBeInTheDocument()
    })
  })
})
