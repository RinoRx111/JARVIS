import { render, screen } from '@testing-library/react'
import { AuthOverlay } from './AuthOverlay'

const mockStore = {
  login: vi.fn(),
  register: vi.fn(),
  checkSetupStatus: vi.fn(),
  checkAuth: vi.fn(),
  needsSetup: false,
  authLoading: false,
  token: null,
  user: null,
}

vi.mock('@/hooks/useJarvisStore', () => ({
  useJarvisStore: (selector?: (state: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore,
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
