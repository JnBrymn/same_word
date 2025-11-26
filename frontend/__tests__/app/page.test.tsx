import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import Home from '@/app/page'

// Mock fetch globally
global.fetch = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('Home Page', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(global.fetch as jest.Mock).mockClear()
    // Default mock for games list polling
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/games') && !url.includes('/games/create') && !url.includes('/games/join')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        })
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`))
    })
  })

  describe('Create Game', () => {
    it('validates that player name is required', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter game name/i)).toBeInTheDocument()
      })

      const gameNameInput = screen.getByPlaceholderText(/enter game name/i)
      const createButton = screen.getByRole('button', { name: /^GO$/i })

      await user.type(gameNameInput, 'testgame')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter your name')).toBeInTheDocument()
      })
    })

    it('validates that game name is required', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      
      render(<Home />)

      const playerNameInput = screen.getByPlaceholderText(/enter your name/i)
      const createButton = screen.getByRole('button', { name: /^GO$/i })

      await user.type(playerNameInput, 'Test Player')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a game name')).toBeInTheDocument()
      })
    })

    it('validates that game name must be lowercase', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      })
      
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter game name/i)).toBeInTheDocument()
      })

      const playerNameInput = screen.getByPlaceholderText(/enter your name/i)
      const gameNameInput = screen.getByPlaceholderText(/enter game name/i)
      const createButton = screen.getByRole('button', { name: /^GO$/i })

      await user.type(playerNameInput, 'Test Player')
      await user.type(gameNameInput, 'TestGame')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Game name must be lowercase')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('successfully creates game and redirects', async () => {
      const user = userEvent.setup()
      
      // Mock the create game POST
      ;(global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/games/create') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              game_id: 'game123',
              player_id: 'player123',
            }),
          })
        }
        // Games list polling
        if (url.includes('/games') && !url.includes('/games/create') && !url.includes('/games/join')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          })
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`))
      })
      
      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter game name/i)).toBeInTheDocument()
      })

      const playerNameInput = screen.getByPlaceholderText(/enter your name/i)
      const gameNameInput = screen.getByPlaceholderText(/enter game name/i)
      const createButton = screen.getByRole('button', { name: /^GO$/i })

      await user.type(playerNameInput, 'Test Player')
      await user.type(gameNameInput, 'testgame')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/waiting-room?game_id=game123&player_id=player123')
      }, { timeout: 3000 })
    })
  })

  describe('Join Game', () => {
    it('validates that player name is required', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [
          { game_name: 'testgame', game_id: 'game1', player_count: 1 },
        ],
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('testgame')).toBeInTheDocument()
      })

      const joinButton = screen.getByText('testgame').closest('button')
      if (joinButton) {
        await user.click(joinButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Please enter your name')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('successfully joins game and redirects', async () => {
      const user = userEvent.setup()
      
      // Mock polling for games list
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/games') && !url.includes('/games/')) {
          // Games list endpoint
          return Promise.resolve({
            ok: true,
            json: async () => [
              { game_name: 'testgame', game_id: 'game1', player_count: 1 },
            ],
          })
        }
        if (url.includes('/games/join')) {
          // Join endpoint
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              game_id: 'game1',
              player_id: 'player123',
            }),
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('testgame')).toBeInTheDocument()
      })

      const playerNameInput = screen.getByPlaceholderText(/enter your name/i)
      await user.type(playerNameInput, 'Test Player')

      const joinButton = screen.getByText('testgame').closest('button')
      if (joinButton) {
        await user.click(joinButton)
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/waiting-room?game_id=game1&player_id=player123')
      }, { timeout: 3000 })
    })
  })

  describe('Games List', () => {
    it('fetches and displays available games', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { game_name: 'game1', game_id: 'id1', player_count: 2 },
          { game_name: 'game2', game_id: 'id2', player_count: 1 },
        ],
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('game1')).toBeInTheDocument()
        expect(screen.getByText('game2')).toBeInTheDocument()
      })

      expect(screen.getByText('2 players')).toBeInTheDocument()
      expect(screen.getByText('1 player')).toBeInTheDocument()
    })

    it('shows message when no games available', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/no games available/i)).toBeInTheDocument()
      })
    })
  })
})

