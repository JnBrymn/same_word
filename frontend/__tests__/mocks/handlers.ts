import { http, HttpResponse } from 'msw'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

export const handlers = [
  // Mock handlers will be added here as needed for specific tests
  // For now, we'll use default implementations in individual test files
]

