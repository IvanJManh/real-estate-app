import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock specific data needed for tests
jest.mock('./properties.json', () => [
  {
    id: "prop1",
    type: "House",
    price: 450000,
    bedrooms: 3,
    dateAdded: "2023-10-01",
    postcode: "BR1",
    location: "Bromley",
    description: "Desc",
    images: ["img.jpg"],
    map: ""
  },
  {
    id: "prop2",
    type: "Flat",
    price: 250000,
    bedrooms: 1,
    dateAdded: "2023-10-15",
    postcode: "NW1",
    location: "Camden",
    description: "Desc",
    images: ["img.jpg"],
    map: ""
  }
]);

test('renders the main heading', () => {
  render(<App />);
  const linkElement = screen.getByText(/Rightmove Clone/i);
  expect(linkElement).toBeInTheDocument();
});

test('filters properties by type', () => {
  render(<App />);
  // Initially both should be visible (mocked data has 1 House, 1 Flat)
  // Select 'House' from dropdown
  const typeSelect = screen.getByText('Type').nextSibling;
  fireEvent.change(typeSelect, { target: { value: 'House' } });
  
  // Check if House exists and Flat does not
  expect(screen.getByText(/Bromley/i)).toBeInTheDocument();
  expect(screen.queryByText(/Camden/i)).not.toBeInTheDocument();
});

test('adds property to favorites on button click', () => {
  render(<App />);
  // Click save on first property
  const saveButtons = screen.getAllByText(/Save/i);
  fireEvent.click(saveButtons[0]);
  
  // Check sidebar for Saved item
  const savedHeader = screen.getByText(/Saved Properties/i);
  expect(savedHeader).toBeInTheDocument();
  const clearBtn = screen.getByText(/Clear All/i);
  expect(clearBtn).toBeInTheDocument();
});

test('prevents duplicate favorites', () => {
  window.alert = jest.fn(); // Mock alert
  render(<App />);
  const saveButtons = screen.getAllByText(/Save/i);
  
  // Click twice
  fireEvent.click(saveButtons[0]);
  fireEvent.click(saveButtons[0]);
  
  expect(window.alert).toHaveBeenCalledWith("Property already in favorites!");
});

test('removes favorite when delete button clicked', () => {
  render(<App />);
  const saveButtons = screen.getAllByText(/Save/i);
  fireEvent.click(saveButtons[0]);
  
  // Find delete button (X) in sidebar and click
  const deleteBtn = screen.getByText('X');
  fireEvent.click(deleteBtn);
  
  // Should revert to empty state text
  expect(screen.getByText(/Drag properties here to save/i)).toBeInTheDocument();
});