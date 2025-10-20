import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import casedemo2 from '../casedemo2';

test('increases counter when button is clicked', async () => {
    const user = userEvent.setup();
    render(<casedemo2 />);
    const button = await screen.findByRole('button');
    await user.click(button);
    expect(screen.getByTestId('message')).toHaveTextContent("You've clicked the button 1 time");
});

test('displays the correct message when counter is zero', async () => {
    render(<casedemo2 />);
    expect(screen.getByTestId('message')).toHaveTextContent('You should try clicking the button.');
});
