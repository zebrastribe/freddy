class UUIDGenerator {
  static generateUUID() { return '550e8400-e29b-41d4-a716-446655440000'; }
  static generatePetUUID() { return 'pet_550e8400-e29b-41d4-a716-446655440000'; }
  static generateUserUUID() { return 'user_550e8400-e29b-41d4-a716-446655440000'; }
  static isValidUUID() { return true; }
  static isValidPrefixedUUID() { return true; }
  static extractUUID() { return '550e8400-e29b-41d4-a716-446655440000'; }
  static generateShortId() { return 'abc12345'; }
}

export { UUIDGenerator }; 