import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCardSkeleton } from '../JobCardSkeleton';

describe('JobCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<JobCardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the card wrapper with rounded corners matching JobCard', () => {
    render(<JobCardSkeleton />);
    const card = screen.getByTestId('job-card-skeleton');
    expect(card.className).toContain('rounded-xl');
  });

  it('renders skeleton placeholder elements', () => {
    const { container } = render(<JobCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});
