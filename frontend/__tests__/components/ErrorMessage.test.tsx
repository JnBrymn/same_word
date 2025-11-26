import { render, screen } from '@testing-library/react'
import ErrorMessage from '@/components/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the error message', () => {
    render(<ErrorMessage message="Test error message" />)
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('applies correct styling', () => {
    render(<ErrorMessage message="Error" />)
    const errorDiv = screen.getByText('Error')
    expect(errorDiv).toHaveStyle({
      backgroundColor: '#ffebee',
      color: '#c62828',
    })
  })
})

