import { VerificationResult } from './types';

/**
 * Verification layer for transaction validation
 * Currently a stub that allows everything - will be enhanced with actual verification logic
 */
export class TransactionVerifier {
  
  /**
   * Verify that the encoded transaction matches the metadata (if provided)
   * @param encodedTx - Hex-encoded transaction string
   * @param metadata - Optional metadata in any format to verify against
   * @returns Verification result
   */
  static verifyTransaction(encodedTx: string, metadata?: Record<string, any> | string | number | boolean | null): VerificationResult {
    // TODO: Implement actual verification logic using the verification library
    // For now, this is a stub that allows everything
    
    console.log('🔍 Verifying transaction...');
    console.log(`   Encoded TX length: ${encodedTx.length} chars`);
    console.log(`   Has metadata: ${!!metadata}`);
    if (metadata) {
      console.log(`   Metadata type: ${typeof metadata}`);
      if (typeof metadata === 'object' && metadata !== null) {
        console.log(`   Metadata keys: ${Object.keys(metadata).length}`);
      }
    }
    
    // Basic validation - check if transaction is hex string
    if (!this.isValidHex(encodedTx)) {
      return {
        isValid: false,
        errors: ['Transaction must be a valid hex string']
      };
    }
    
    // Stub: Always return valid for now
    console.log('✅ Transaction verification passed (stub)');
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
   * Placeholder for future verification methods
   */
  static verifyTransactionStructure(encodedTx: string): VerificationResult {
    // TODO: Implement transaction structure validation
    return { isValid: true };
  }
  
  static verifyMetadataConsistency(encodedTx: string, metadata: Record<string, any> | string | number | boolean | null): VerificationResult {
    // TODO: Implement metadata consistency checks
    return { isValid: true };
  }
}
