import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('App Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    // Add assertions here, for example:
    // expect(getByText('Some Text')).toBeTruthy();
  });
});
