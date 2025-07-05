import { VerificationResult, TransactionMetadata } from './types';

/**
 * Verification layer for transaction validation
 *
 * TODO: Implement actual verification logic to compare metadata against encoded transaction:
 * - Parse the encoded transaction to extract actual values
 * - Compare metadata.amount with transaction output amounts
 * - Compare metadata.recipient with transaction output addresses
 * - Compare metadata.fee with calculated transaction fee
 * - Verify other metadata fields against transaction data
 * - Return detailed verification errors for mismatches
 *
 * Currently a stub that allows everything - will be enhanced with actual verification logic
 */
export class TransactionVerifier {
  
  /**
   * Verify that the encoded transaction matches the metadata (if provided)
   * @param encodedTx - Hex-encoded transaction string
   * @param metadata - Optional metadata in any format to verify against
   * @returns Verification result
   */
  static verifyTransaction(encodedTx: string, metadata?: TransactionMetadata): VerificationResult {
    console.log('🔍 Verifying transaction...');
    console.log(`   Encoded TX length: ${encodedTx.length} chars`);
    console.log(`   Has metadata: ${!!metadata}`);

    // Basic validation - check if transaction is hex string
    if (!this.isValidHex(encodedTx)) {
      return {
        isValid: false,
        errors: ['Transaction must be a valid hex string']
      };
    }

    // Phase 1: Shallow metadata validation (if metadata is provided)
    if (metadata) {
      console.log('   🔍 Performing shallow metadata validation...');
      const metadataValidation = this.validateMetadataStructure(metadata);

      if (!metadataValidation.isValid) {
        console.log('   ❌ Metadata validation failed');
        return metadataValidation;
      }
      console.log('   ✅ Metadata structure validation passed');
    }

    console.log('✅ Transaction verification passed');
    return {
      isValid: true
    };
  }
  
  /**
   * Check if string is valid hexadecimal
   */
  private static isValidHex(str: string): boolean {
    if (str.length === 0 || str.length % 2 !== 0) {
      return false;
    }
    return /^[0-9a-fA-F]+$/.test(str);
  }

  /**
   * Phase 1: Shallow validation of metadata structure
   * Validates that the 4 required fields are present and have correct basic structure
   */
  private static validateMetadataStructure(metadata: TransactionMetadata): VerificationResult {
    const errors: string[] = [];

    // Validate inputs field
    if (!Array.isArray(metadata.inputs)) {
      errors.push('inputs must be an array');
    } else if (metadata.inputs.length === 0) {
      errors.push('inputs array cannot be empty');
    }

    // Validate outputs field
    if (!Array.isArray(metadata.outputs)) {
      errors.push('outputs must be an array');
    } else if (metadata.outputs.length === 0) {
      errors.push('outputs array cannot be empty');
    }

    // Validate fee field
    if (!metadata.fee || typeof metadata.fee !== 'object') {
      errors.push('fee must be an object');
    } else {
      if (!metadata.fee.atoms || typeof metadata.fee.atoms !== 'string') {
        errors.push('fee.atoms must be a string');
      }
      if (!metadata.fee.decimal || typeof metadata.fee.decimal !== 'string') {
        errors.push('fee.decimal must be a string');
      }
    }

    // Validate id field
    if (!metadata.id || typeof metadata.id !== 'string') {
      errors.push('id must be a string');
    } else if (metadata.id.length === 0) {
      errors.push('id cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Placeholder for future verification methods
   */
  static verifyTransactionStructure(encodedTx: string): VerificationResult {
    // TODO: Implement transaction structure validation
    // - Verify transaction format is valid for Mintlayer
    // - Check that all required fields are present
    // - Validate signature format and structure
    return { isValid: true };
  }

  static verifyMetadataConsistency(encodedTx: string, metadata: TransactionMetadata): VerificationResult {
    // TODO: Implement metadata consistency checks
    // - Parse transaction to extract actual values
    // - Compare with metadata fields if they exist
    // - Return specific errors for mismatches
    // Example checks:
    //   if (metadata.amount && parsedTx.totalOutput !== metadata.amount) return { isValid: false, errors: ['Amount mismatch'] }
    //   if (metadata.recipient && !parsedTx.outputs.includes(metadata.recipient)) return { isValid: false, errors: ['Recipient mismatch'] }
    return { isValid: true };
  }
}
