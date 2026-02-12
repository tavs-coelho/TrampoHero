import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from '../BottomNav';
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

describe('BottomNav', () => {
  it('renders all 4 navigation buttons', () => {
    const mockUser = createMockUser();
    render(<BottomNav user={mockUser} view="browse" setView={() => {}} />);
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Job Ativo')).toBeInTheDocument();
    expect(screen.getByText('Carteira')).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();
  });

  it('clicking Início calls setView with "browse" for freelancer', () => {
    const setView = vi.fn();
    const mockUser = createMockUser({ role: 'freelancer' });
    render(<BottomNav user={mockUser} view="active" setView={setView} />);
    fireEvent.click(screen.getByText('Início'));
    expect(setView).toHaveBeenCalledWith('browse');
  });

  it('clicking Início calls setView with "dashboard" for employer', () => {
    const setView = vi.fn();
    const mockUser = createMockUser({ role: 'employer' });
    render(<BottomNav user={mockUser} view="active" setView={setView} />);
    fireEvent.click(screen.getByText('Início'));
    expect(setView).toHaveBeenCalledWith('dashboard');
  });

  it('clicking Job Ativo calls setView with "active"', () => {
    const setView = vi.fn();
    const mockUser = createMockUser();
    render(<BottomNav user={mockUser} view="browse" setView={setView} />);
    fireEvent.click(screen.getByText('Job Ativo'));
    expect(setView).toHaveBeenCalledWith('active');
  });

  it('clicking Carteira calls setView with "wallet"', () => {
    const setView = vi.fn();
    const mockUser = createMockUser();
    render(<BottomNav user={mockUser} view="browse" setView={setView} />);
    fireEvent.click(screen.getByText('Carteira'));
    expect(setView).toHaveBeenCalledWith('wallet');
  });

  it('clicking Suporte calls setView with "chat"', () => {
    const setView = vi.fn();
    const mockUser = createMockUser();
    render(<BottomNav user={mockUser} view="browse" setView={setView} />);
    fireEvent.click(screen.getByText('Suporte'));
    expect(setView).toHaveBeenCalledWith('chat');
  });

  it('active view gets highlighted styling', () => {
    const mockUser = createMockUser();
    const { container } = render(<BottomNav user={mockUser} view="browse" setView={() => {}} />);
    const buttons = container.querySelectorAll('button');
    const homeButton = buttons[0];
    expect(homeButton.className).toContain('text-indigo-600');
  });
});
