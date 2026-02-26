import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '../JobCard';
import { Niche } from '../../types';
import type { Job } from '../../types';

const mockJob: Job = {
  id: 'j1',
  employerId: 'emp-1',
  title: 'Garçom para Evento',
  employer: 'Restaurante X',
  employerRating: 4.5,
  niche: Niche.EVENTS,
  location: 'São Paulo, SP',
  coordinates: { lat: -23.55, lng: -46.63 },
  payment: 150,
  paymentType: 'dia',
  description: 'Servir em evento',
  date: '2026-02-15',
  startTime: '18:00',
  status: 'open',
};

describe('JobCard', () => {
  it('renders job title', () => {
    render(<JobCard job={mockJob} onClick={() => {}} />);
    expect(screen.getByText('Garçom para Evento')).toBeInTheDocument();
  });

  it('renders job payment', () => {
    render(<JobCard job={mockJob} onClick={() => {}} />);
    expect(screen.getByText('R$ 150')).toBeInTheDocument();
  });

  it('renders employer name', () => {
    render(<JobCard job={mockJob} onClick={() => {}} />);
    expect(screen.getByText(/Restaurante X/)).toBeInTheDocument();
  });

  it('renders niche label', () => {
    render(<JobCard job={mockJob} onClick={() => {}} />);
    expect(screen.getByText(Niche.EVENTS)).toBeInTheDocument();
  });

  it('clicking the card calls onClick with the job', () => {
    const onClick = vi.fn();
    render(<JobCard job={mockJob} onClick={onClick} />);
    fireEvent.click(screen.getByText('Garçom para Evento'));
    expect(onClick).toHaveBeenCalledWith(mockJob);
  });

  it('shows "Destaque" badge when isBoosted is true', () => {
    const boostedJob = { ...mockJob, isBoosted: true };
    render(<JobCard job={boostedJob} onClick={() => {}} />);
    expect(screen.getByText('Destaque')).toBeInTheDocument();
  });

  it('shows "Seguro" badge when isEscrowGuaranteed is true', () => {
    const escrowJob = { ...mockJob, isEscrowGuaranteed: true };
    render(<JobCard job={escrowJob} onClick={() => {}} />);
    expect(screen.getByText('Seguro')).toBeInTheDocument();
  });
});
