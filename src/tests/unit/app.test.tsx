import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../app/App';

describe('App', () => {
  it('renders the iteration headline and dev console heading', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /ratw tracker/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /iteration 1 · domain models in motion/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /segments development console/i })).toBeInTheDocument();
  });
});
