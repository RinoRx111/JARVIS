import { render, screen } from '@testing-library/react'
import { AuthOverlay } from './AuthOverlay'

vi.mock('@/hooks/useJarvisStore', () => ({
  useJarvisStore: () => ({
    login: vi.fn(),
    register: vi.fn(),
    checkSetupStatus: vi.fn(),
    checkAuth: vi.fn(),
    needsSetup: false,
    authLoading: false,
    token: null,
    user: null,
  })
}))

describe('AuthOverlay Component', () => {
  it('renders the login text', () => {
    render(<AuthOverlay />)
    // There should be a login or submit button or text somewhere
    // The exact text depends on the component's implementation
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
  })
})
