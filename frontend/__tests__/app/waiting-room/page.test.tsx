import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import WaitingRoom from '@/app/waiting-room/page'

// Mock fetch globally
global.fetch = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

describe('Waiting Room', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }
  const mockSearchParams = new URLSearchParams('game_id=game1&player_id=player1')

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Start Game', () => {
    it('requires at least 3 players to start', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: [
            { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
            { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
          ],
          creator_id: 'player1',
          status: 'waiting',
          rounds_per_player: null,
          current_turn_index: null,
          current_round: 0,
        }),
      })

      render(<WaitingRoom />)

      await waitFor(() => {
        expect(screen.getByText(/waiting for more players/i)).toBeInTheDocument()
      })

      const startButton = screen.getByRole('button', { name: /waiting for more players/i })
      expect(startButton).toBeDisabled()
    })

    it('validates rounds must be at least 1', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: [
            { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
            { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
            { name: 'Player 3', player_id: 'player3', score: 0, is_creator: false },
          ],
          creator_id: 'player1',
          status: 'waiting',
          rounds_per_player: null,
          current_turn_index: null,
          current_round: 0,
        }),
      })

      render(<WaitingRoom />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
      })

      const roundsInput = screen.getByLabelText(/number of rounds per player/i)
      const startButton = screen.getByRole('button', { name: /start game/i })

      await user.clear(roundsInput)
      await user.type(roundsInput, '0')
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid number of rounds/i)).toBeInTheDocument()
      })
    })

    it('only allows creator to start game', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: [
            { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
            { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
            { name: 'Player 3', player_id: 'player3', score: 0, is_creator: false },
          ],
          creator_id: 'player1',
          status: 'waiting',
          rounds_per_player: null,
          current_turn_index: null,
          current_round: 0,
        }),
      })

      render(<WaitingRoom />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
      })

      // Creator should see start button
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
    })

    it('shows waiting message for non-creators', async () => {
      const nonCreatorParams = new URLSearchParams('game_id=game1&player_id=player2')
      ;(useSearchParams as jest.Mock).mockReturnValue(nonCreatorParams)

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: [
            { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
            { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
          ],
          creator_id: 'player1',
          status: 'waiting',
          rounds_per_player: null,
          current_turn_index: null,
          current_round: 0,
        }),
      })

      render(<WaitingRoom />)

      await waitFor(() => {
        expect(screen.getByText(/waiting for the game creator/i)).toBeInTheDocument()
      })
    })

    it('successfully starts game and redirects', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            game_id: 'game1',
            game_name: 'Test Game',
            players: [
              { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
              { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
              { name: 'Player 3', player_id: 'player3', score: 0, is_creator: false },
            ],
            creator_id: 'player1',
            status: 'waiting',
            rounds_per_player: null,
            current_turn_index: null,
            current_round: 0,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<WaitingRoom />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
      })

      const startButton = screen.getByRole('button', { name: /start game/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/game?game_id=game1&player_id=player1')
      })
    })
  })

  describe('Player Display', () => {
    it('displays all players correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: [
            { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
            { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
          ],
          creator_id: 'player1',
          status: 'waiting',
          rounds_per_player: null,
          current_turn_index: null,
          current_round: 0,
        }),
      })

      render(<WaitingRoom />)

      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument()
        expect(screen.getByText('Player 2')).toBeInTheDocument()
      })

      expect(screen.getByText('(Creator)')).toBeInTheDocument()
    })

    it('shows player count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          game_id: 'game1',
          game_name: 'Test Game',
          players: [
            { name: 'Player 1', player_id: 'player1', score: 0, is_creator: true },
            { name: 'Player 2', player_id: 'player2', score: 0, is_creator: false },
          ],
          creator_id: 'player1',
          status: 'waiting',
          rounds_per_player: null,
          current_turn_index: null,
          current_round: 0,
        }),
      })

      render(<WaitingRoom />)

      await waitFor(() => {
        expect(screen.getByText(/players \(2\)/i)).toBeInTheDocument()
      })
    })
  })
})
