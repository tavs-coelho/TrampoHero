import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { Niche, SubscriptionTier } from '../../types';
import type { UserProfile } from '../../types';

const createMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'u1',
  name: 'Test User',
  bio: 'Test bio',
  niche: Niche.EVENTS,
  role: 'freelancer',
  rating: 4.5,
  wallet: { balance: 100, pending: 0, scheduled: 0, transactions: [] },
  history: [],
  medals: [],
  isPrime: false,
  tier: SubscriptionTier.FREE,
  referralCode: 'REF123',
  ...overrides,
});

describe('Header', () => {
  const defaultProps = () => ({
    user: createMockUser(),
    setView: vi.fn(),
    setShowPrimeModal: vi.fn(),
    setUser: vi.fn(),
  });

  it('renders TrampoHero brand name', () => {
    render(<Header {...defaultProps()} />);
    expect(screen.getByText('TrampoHero')).toBeInTheDocument();
  });

  it('renders "Empresa" button for freelancer', () => {
    const props = defaultProps();
    props.user = createMockUser({ role: 'freelancer' });
    render(<Header {...props} />);
    expect(screen.getByText('Empresa')).toBeInTheDocument();
  });

  it('renders "Freelancer" button for employer', () => {
    const props = defaultProps();
    props.user = createMockUser({ role: 'employer' });
    render(<Header {...props} />);
    expect(screen.getByText('Freelancer')).toBeInTheDocument();
  });

  it('shows Prime badge when user.isPrime is true', () => {
    const props = defaultProps();
    props.user = createMockUser({ role: 'freelancer', isPrime: true });
    render(<Header {...props} />);
    expect(screen.getByText('Prime ativo')).toBeInTheDocument();
  });

  it('profile click calls setView with "profile"', () => {
    const props = defaultProps();
    render(<Header {...props} />);
    fireEvent.click(screen.getByLabelText('Abrir perfil'));
    expect(props.setView).toHaveBeenCalledWith('profile');
  });

  it('role switch button calls setUser with toggled role', () => {
    const props = defaultProps();
    props.user = createMockUser({ role: 'freelancer' });
    render(<Header {...props} />);
    fireEvent.click(screen.getByText('Empresa'));
    expect(props.setUser).toHaveBeenCalledOnce();
    // Verify the updater function toggles the role
    const updater = props.setUser.mock.calls[0][0] as (prev: UserProfile) => UserProfile;
    const result = updater(props.user);
    expect(result.role).toBe('employer');
  });
});
