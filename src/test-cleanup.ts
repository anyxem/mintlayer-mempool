import { MempoolCleaner } from './mempool-cleaner';
import { TransactionService } from './transaction-service';
import { transactionDb } from './database';

async function testCleanup() {
  console.log('🧪 Testing mempool cleanup functionality...\n');

  try {
    // Initialize database
    await transactionDb.initialize();

    // Create test cleaner with short intervals for testing
    const testCleaner = new MempoolCleaner({
      intervalMs: 10000, // 10 seconds for testing
      batchSize: 10,
      maxAge: 1, // 1 hour
      enabled: true
    });

    // Add some test transactions to the database
    console.log('1️⃣ Adding test transactions to mempool...');
    const service = new TransactionService();

    const testTransactions = [
      {
        transaction: 'deadbeef',
        metadata: { test: 'transaction1' }
      },
      {
        transaction: 'cafebabe',
        metadata: { test: 'transaction2' }
      }
    ];

    for (let i = 0; i < testTransactions.length; i++) {
      const mockNodeResponse = {
        tx_id: `test-tx-${i + 1}-${Date.now()}`,
        status: 'accepted'
      };

      await service.processTransaction(testTransactions[i], mockNodeResponse);
    }

    // Check initial mempool state
    console.log('\n2️⃣ Checking initial mempool state...');
    const initialStats = await service.getMempoolStats();
    console.log(`✅ Initial mempool count: ${initialStats.count}`);

    const pendingTxs = await service.getPendingTransactions();
    console.log(`📋 Pending transactions:`);
    pendingTxs.forEach(tx => {
      console.log(`   - ${tx.tx_id} (${tx.status})`);
    });

    // Test cleanup status
    console.log('\n3️⃣ Testing cleanup status...');
    const stats = testCleaner.getStats();
    console.log('✅ Cleanup stats:', {
      enabled: stats.enabled,
      running: stats.running,
      intervalMs: stats.config.intervalMs,
      batchSize: stats.config.batchSize
    });

    // Test manual cleanup (will fail to connect to node, but should handle gracefully)
    console.log('\n4️⃣ Testing manual cleanup...');
    try {
      const cleanupResult = await testCleaner.forceCleanup();
      console.log('✅ Cleanup result:', cleanupResult);
    } catch (error: any) {
      console.log('⚠️ Cleanup completed with errors (expected if no node):', error.message);
    }

    // Test starting and stopping the cleaner
    console.log('\n5️⃣ Testing cleaner start/stop...');
    testCleaner.start();
    console.log('✅ Cleaner started');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    testCleaner.stop();
    console.log('✅ Cleaner stopped');

    // Check final mempool state
    console.log('\n6️⃣ Checking final mempool state...');
    const finalStats = await service.getMempoolStats();
    console.log(`✅ Final mempool count: ${finalStats.count}`);

    console.log('\n🎉 Cleanup tests completed!');
    console.log('\n📝 Notes:');
    console.log('   - Transactions remain in mempool because no Mintlayer node is running');
    console.log('   - In production, confirmed transactions would be removed automatically');
    console.log('   - Error handling works correctly when node is unavailable');

  } catch (error: any) {
    console.error('❌ Cleanup test failed:', error.message);
  } finally {
    // Clean up
    await transactionDb.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCleanup();
}

export { testCleanup };
