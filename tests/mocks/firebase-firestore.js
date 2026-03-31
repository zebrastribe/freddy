/**
 * Mock Firebase Firestore for testing
 */

const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();

module.exports = {
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  collection: mockCollection,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere
}; 