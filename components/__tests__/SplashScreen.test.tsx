import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplashScreen } from '../SplashScreen';

describe('SplashScreen', () => {
  it('renders "TrampoHero" text', () => {
    render(<SplashScreen />);
    expect(screen.getByText('TrampoHero')).toBeInTheDocument();
  });

  it('renders "Conectando Talentos" subtitle', () => {
    render(<SplashScreen />);
    expect(screen.getByText('Conectando Talentos')).toBeInTheDocument();
  });
});
