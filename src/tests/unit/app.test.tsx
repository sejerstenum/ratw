import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../app/App';

describe('App', () => {
  it('renders the headline', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /ratw tracker/i })).toBeInTheDocument();
  });
});
