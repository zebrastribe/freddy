/**
 * Mock Firebase Auth for testing
 */

const mockSignInAnonymously = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockSignOut = jest.fn();

module.exports = {
  signInAnonymously: mockSignInAnonymously,
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: mockSignOut
}; 