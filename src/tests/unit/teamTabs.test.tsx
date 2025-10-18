import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { TeamTabs } from '../../components/TeamTabs';

describe('TeamTabs', () => {
  it('invokes onSelect when navigating with keyboard', async () => {
    const onSelect = vi.fn();
    render(<TeamTabs activeTeam="A" onSelect={onSelect} />);

    const activeTab = screen.getByRole('tab', { name: /team a/i });
    activeTab.focus();

    const user = userEvent.setup();
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{End}');

    expect(onSelect).toHaveBeenNthCalledWith(1, 'B');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'E');
    expect(onSelect).toHaveBeenNthCalledWith(3, 'E');
  });
});
