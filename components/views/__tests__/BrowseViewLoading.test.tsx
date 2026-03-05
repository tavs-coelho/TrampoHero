import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowseView } from '../BrowseView';
import {
  createMockUser,
  createMockJob,
} from '../../../__tests__/testUtils';

describe('BrowseView loading state', () => {
  it('renders 5 skeleton cards when isLoading is true', () => {
    const job = createMockJob();
    render(
      <BrowseView
        sortedOpenJobs={[job]}
        browseMode="list"
        setBrowseMode={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        setSelectedJob={vi.fn()}
        mapContainerRef={{ current: null }}
        user={createMockUser()}
        setView={vi.fn()}
        setShowPrimeModal={vi.fn()}
        isLoading={true}
      />
    );
    const skeletonCards = screen.getAllByTestId('job-card-skeleton');
    expect(skeletonCards.length).toBe(5);
    expect(screen.queryByText('Garçom para Evento')).not.toBeInTheDocument();
  });

  it('does not render skeleton cards when isLoading is false', () => {
    const job = createMockJob();
    render(
      <BrowseView
        sortedOpenJobs={[job]}
        browseMode="list"
        setBrowseMode={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        setSelectedJob={vi.fn()}
        mapContainerRef={{ current: null }}
        user={createMockUser()}
        setView={vi.fn()}
        setShowPrimeModal={vi.fn()}
        isLoading={false}
      />
    );
    expect(screen.queryAllByTestId('job-card-skeleton').length).toBe(0);
    expect(screen.getByText('Garçom para Evento')).toBeInTheDocument();
  });

  it('defaults isLoading to false when prop is not provided', () => {
    const job = createMockJob();
    render(
      <BrowseView
        sortedOpenJobs={[job]}
        browseMode="list"
        setBrowseMode={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        setSelectedJob={vi.fn()}
        mapContainerRef={{ current: null }}
        user={createMockUser()}
        setView={vi.fn()}
        setShowPrimeModal={vi.fn()}
      />
    );
    expect(screen.queryAllByTestId('job-card-skeleton').length).toBe(0);
    expect(screen.getByText('Garçom para Evento')).toBeInTheDocument();
  });
});
