import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom';

import { App } from '../../app/App';

describe('App', () => {
  it('renders the iteration 2 headline and filtering controls', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /ratw tracker/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /iteration 2 · legs & teams in sync/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/active leg/i)).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: /teams/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /segments development console/i })).toBeInTheDocument();
  });

  it('hydrates active leg from the query string and applies it to the add form', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
        },
      ],
      { initialEntries: ['/?leg=3'] },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/active leg/i)).toHaveValue('3');
    });

    expect(screen.getByLabelText(/^Leg$/i)).toHaveValue('3');
  });

  it('updates the leg query parameter when selecting a new leg', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);

    const user = userEvent.setup();
    const activeLegSelect = screen.getByLabelText(/active leg/i);

    await user.selectOptions(activeLegSelect, '3');
    await waitFor(() => {
      expect(router.state.location.search).toBe('?leg=3');
    });

    await user.selectOptions(activeLegSelect, '1');
    await waitFor(() => {
      expect(router.state.location.search).toBe('');
    });
  });
});
