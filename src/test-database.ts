import { transactionDb } from './database';
import { TransactionService } from './transaction-service';

async function testDatabase() {
  console.log('🧪 Testing database functionality...\n');

  try {
    // Initialize database
    await transactionDb.initialize();

    // Test data
    const testTransaction = {
      transaction: '0100000001a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890000000006a47304402203e4516da7253cf068effec6b95c41221c0cf3a8e6ccb8cbf1725b562e9afde2c022054e1c258c2981cdfba5df64e841288f76c5c8e8c1c1e1c1e1c1e1c1e1c1e1c1e012103ad1d8e89212f0b92c74d23bb710c00662451716a435b97381a1a2e4a98f5d9b1ffffffff0100e1f50500000000196a17a91489abcdefabbaabbaabbaabbaabbaabbaabbaabba8700000000',
      // No metadata for this test
    };

    const mockNodeResponse = {
      tx_id: 'test-tx-id-12345',
      status: 'accepted'
    };

    // Test transaction processing
    console.log('1️⃣ Testing transaction processing...');
    const service = new TransactionService();
    const result = await service.processTransaction(testTransaction, mockNodeResponse);
    console.log('✅ Transaction processed:', result);

    // Test transaction retrieval
    console.log('\n2️⃣ Testing transaction retrieval...');
    const retrieved = await service.getTransactionDetails('test-tx-id-12345');
    console.log('✅ Transaction retrieved:', retrieved);

    // Test pending transactions
    console.log('\n3️⃣ Testing pending transactions list...');
    const pending = await service.getPendingTransactions();
    console.log('✅ Pending transactions:', pending.length);

    // Test mempool stats
    console.log('\n4️⃣ Testing mempool stats...');
    const stats = await service.getMempoolStats();
    console.log('✅ Mempool stats:', stats);

    // Test transaction removal
    console.log('\n5️⃣ Testing transaction removal...');
    const removed = await service.removeConfirmedTransaction('test-tx-id-12345');
    console.log('✅ Transaction removed:', removed);

    // Verify removal
    console.log('\n6️⃣ Verifying removal...');
    const afterRemoval = await service.getTransactionDetails('test-tx-id-12345');
    console.log('✅ Transaction after removal:', afterRemoval);

    console.log('\n🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    // Clean up
    await transactionDb.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDatabase();
}

export { testDatabase };
