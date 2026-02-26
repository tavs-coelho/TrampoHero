import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('renders the message text', () => {
    render(<Toast message="Operation successful" type="success" onClose={() => {}} />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('renders success type with correct styling', () => {
    const { container } = render(<Toast message="Success" type="success" onClose={() => {}} />);
    const toastEl = container.firstChild as HTMLElement;
    expect(toastEl.className).toContain('bg-emerald-500');
  });

  it('renders error type with correct styling', () => {
    const { container } = render(<Toast message="Error" type="error" onClose={() => {}} />);
    const toastEl = container.firstChild as HTMLElement;
    expect(toastEl.className).toContain('bg-red-500');
  });

  it('renders info type with correct styling', () => {
    const { container } = render(<Toast message="Info" type="info" onClose={() => {}} />);
    const toastEl = container.firstChild as HTMLElement;
    expect(toastEl.className).toContain('bg-slate-800');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Toast message="Closeable" type="info" onClose={onClose} />);
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders icon based on type', () => {
    const { container: successContainer } = render(<Toast message="s" type="success" onClose={() => {}} />);
    expect(successContainer.querySelector('.fa-check-circle')).toBeInTheDocument();

    const { container: errorContainer } = render(<Toast message="e" type="error" onClose={() => {}} />);
    expect(errorContainer.querySelector('.fa-exclamation-circle')).toBeInTheDocument();

    const { container: infoContainer } = render(<Toast message="i" type="info" onClose={() => {}} />);
    expect(infoContainer.querySelector('.fa-info-circle')).toBeInTheDocument();
  });
});
