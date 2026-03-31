import { PetUUIDManager } from './js/features/pets/pet_uuid_manager.js';

/**
 * Verification script for the PetUUIDManager refactoring
 * Tests that the new system works correctly with migrated data
 */

class RefactorVerification {
  constructor() {
    this.petUUIDManager = new PetUUIDManager();
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async runVerification() {
    this.log("🔍 Verifying PetUUIDManager Refactoring");
    this.log("=".repeat(60));

    // Test 1: Generate new format UUID
    this.log("Test 1: Generate new format UUID");
    const newPetId = this.petUUIDManager.generatePetUUID("freddy");
    this.log(`  Generated: ${newPetId}`);
    
    // Verify format
    const parts = newPetId.split('_');
    const isNewFormat = parts.length === 4 && 
                       parts[0] === 'pet' && 
                       parts[1].includes('-') && 
                       parts[2] === 'freddy';
    
    if (isNewFormat) {
      this.log("  ✅ New format generation: PASSED");
    } else {
      this.log("  ❌ New format generation: FAILED");
      return false;
    }

    // Test 2: Parse new format
    this.log("Test 2: Parse new format UUID");
    const parsed = this.petUUIDManager.parsePetUUID(newPetId);
    this.log(`  Parsed: ${JSON.stringify(parsed, null, 2)}`);
    
    if (parsed.isLegacy === false && parsed.ownerId === null) {
      this.log("  ✅ New format parsing: PASSED");
    } else {
      this.log("  ❌ New format parsing: FAILED");
      return false;
    }

    // Test 3: Generate legacy format
    this.log("Test 3: Generate legacy format UUID");
    const legacyPetId = this.petUUIDManager.generateLegacyPetUUID("uid123", "max");
    this.log(`  Generated: ${legacyPetId}`);
    
    // Verify legacy format
    const legacyParts = legacyPetId.split('_');
    const isLegacyFormat = legacyParts.length === 5 && 
                          legacyParts[0] === 'pet' && 
                          legacyParts[1].includes('-') && 
                          legacyParts[2] === 'uid123' &&
                          legacyParts[3] === 'max';
    
    if (isLegacyFormat) {
      this.log("  ✅ Legacy format generation: PASSED");
    } else {
      this.log("  ❌ Legacy format generation: FAILED");
      return false;
    }

    // Test 4: Parse legacy format
    this.log("Test 4: Parse legacy format UUID");
    const parsedLegacy = this.petUUIDManager.parsePetUUID(legacyPetId);
    this.log(`  Parsed: ${JSON.stringify(parsedLegacy, null, 2)}`);
    
    if (parsedLegacy.isLegacy === true && parsedLegacy.ownerId === 'uid123') {
      this.log("  ✅ Legacy format parsing: PASSED");
    } else {
      this.log("  ❌ Legacy format parsing: FAILED");
      return false;
    }

    // Test 5: Migration
    this.log("Test 5: Migrate legacy to new format");
    const migratedId = this.petUUIDManager.migrateLegacyUUID(legacyPetId);
    this.log(`  Migrated: ${migratedId}`);
    
    const migratedParsed = this.petUUIDManager.parsePetUUID(migratedId);
    if (migratedParsed.isLegacy === false && migratedParsed.ownerId === null) {
      this.log("  ✅ Migration: PASSED");
    } else {
      this.log("  ❌ Migration: FAILED");
      return false;
    }

    // Test 6: Validation
    this.log("Test 6: Validation tests");
    const validNew = this.petUUIDManager.isValidPetUUID(newPetId);
    const validLegacy = this.petUUIDManager.isValidPetUUID(legacyPetId);
    const validMigrated = this.petUUIDManager.isValidPetUUID(migratedId);
    const invalid = this.petUUIDManager.isValidPetUUID("invalid_uuid");
    
    this.log(`  New format valid: ${validNew}`);
    this.log(`  Legacy format valid: ${validLegacy}`);
    this.log(`  Migrated format valid: ${validMigrated}`);
    this.log(`  Invalid format valid: ${invalid}`);
    
    if (validNew && validLegacy && validMigrated && !invalid) {
      this.log("  ✅ Validation: PASSED");
    } else {
      this.log("  ❌ Validation: FAILED");
      return false;
    }

    // Test 7: Sanitization
    this.log("Test 7: Pet name sanitization");
    const testCases = [
      { input: "Freddy", expected: "freddy" },
      { input: "Max The Cat", expected: "maxthecat" },
      { input: "Luna-123", expected: "luna123" },
      { input: "Shadow@#$%", expected: "shadow" }
    ];
    
    let sanitizationPassed = true;
    for (const testCase of testCases) {
      const sanitized = this.petUUIDManager.sanitizePetName(testCase.input);
      const passed = sanitized === testCase.expected;
      this.log(`  "${testCase.input}" → "${sanitized}" ${passed ? '✅' : '❌'}`);
      if (!passed) sanitizationPassed = false;
    }
    
    if (sanitizationPassed) {
      this.log("  ✅ Sanitization: PASSED");
    } else {
      this.log("  ❌ Sanitization: FAILED");
      return false;
    }

    // Test 8: Extract methods
    this.log("Test 8: Extract methods");
    const extractedPetName = this.petUUIDManager.extractPetName(newPetId);
    const extractedOwnerId = this.petUUIDManager.extractOwnerId(legacyPetId);
    
    this.log(`  Extracted pet name: ${extractedPetName}`);
    this.log(`  Extracted owner ID: ${extractedOwnerId}`);
    
    if (extractedPetName === 'freddy' && extractedOwnerId === 'uid123') {
      this.log("  ✅ Extract methods: PASSED");
    } else {
      this.log("  ❌ Extract methods: FAILED");
      return false;
    }

    // Summary
    this.log("=".repeat(60));
    this.log("🎉 All verification tests PASSED!");
    this.log("✅ PetUUIDManager refactoring is working correctly");
    this.log("✅ New simplified format is functional");
    this.log("✅ Legacy format support is maintained");
    this.log("✅ Migration functionality is working");
    this.log("✅ All validation and parsing is correct");
    
    return true;
  }
}

// Run verification
async function main() {
  const verification = new RefactorVerification();
  const success = await verification.runVerification();
  
  if (success) {
    console.log("\n🚀 PetUUIDManager refactoring verification: SUCCESS");
    process.exit(0);
  } else {
    console.log("\n❌ PetUUIDManager refactoring verification: FAILED");
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { RefactorVerification }; 