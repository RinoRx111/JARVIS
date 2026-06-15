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
  it('renders nothing when authentication is bypassed', () => {
    const { container } = render(<AuthOverlay />)
    expect(container.firstChild).toBeNull()
  })
})
