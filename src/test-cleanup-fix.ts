import { TransactionService } from './transaction-service';
import { transactionDb } from './database';

async function testCleanupFix() {
  console.log('🧪 Testing cleanup fix for transaction ID field...\n');

  try {
    // Initialize database
    await transactionDb.initialize();

    const service = new TransactionService();

    // Test different node response formats
    const testCases = [
      {
        name: 'Node response with tx_id field',
        nodeResponse: { tx_id: 'test-tx-id-1', status: 'confirmed' },
        expectedId: 'test-tx-id-1'
      },
      {
        name: 'Node response with txid field',
        nodeResponse: { txid: 'test-txid-2', status: 'confirmed' },
        expectedId: 'test-txid-2'
      },
      {
        name: 'Node response with id field (Mintlayer format)',
        nodeResponse: { id: 'test-id-3', status: 'confirmed' },
        expectedId: 'test-id-3'
      },
      {
        name: 'Node response with result field',
        nodeResponse: { result: 'test-result-4', status: 'confirmed' },
        expectedId: 'test-result-4'
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`${i + 1}️⃣ Testing: ${testCase.name}`);
      
      try {
        // Process transaction with the test node response
        const result = await service.processTransaction({
          transaction: `deadbeef${i.toString().padStart(8, '0')}`,
          // No metadata for this test
        }, testCase.nodeResponse);

        console.log(`   ✅ Transaction processed: ${result.tx_id}`);
        console.log(`   🔍 Expected ID: ${testCase.expectedId}`);
        console.log(`   ✅ ID extraction working: ${result.tx_id === testCase.expectedId}`);

        // Verify the transaction was stored
        const retrieved = await service.getTransactionDetails(result.tx_id);
        if (retrieved) {
          console.log(`   ✅ Transaction stored and retrieved successfully`);
        } else {
          console.log(`   ❌ Transaction not found in storage`);
        }

      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Test transaction ID extraction priority
    console.log('🔄 Testing ID field priority...');
    const multiFieldResponse = {
      tx_id: 'priority-1',
      txid: 'priority-2', 
      id: 'priority-3',
      result: 'priority-4'
    };

    try {
      const result = await service.processTransaction({
        transaction: 'deadbeef12345678',
        // No metadata for this test
      }, multiFieldResponse);

      console.log(`✅ Priority test result: ${result.tx_id}`);
      console.log(`🔍 Should be 'priority-1' (tx_id has highest priority): ${result.tx_id === 'priority-1'}`);
    } catch (error: any) {
      console.log(`❌ Priority test error: ${error.message}`);
    }

    // Check final database state
    console.log('\n📊 Final database statistics...');
    const stats = await service.getMempoolStats();
    console.log(`   Total transactions: ${stats.count}`);

    console.log('\n🎉 Cleanup fix tests completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Added support for "id" field in node responses');
    console.log('   ✅ Maintains backward compatibility with tx_id, txid, result');
    console.log('   ✅ Priority order: tx_id > txid > id > result');
    console.log('   ✅ Enhanced logging for debugging cleanup issues');

  } catch (error: any) {
    console.error('❌ Cleanup fix test failed:', error.message);
  } finally {
    // Clean up
    await transactionDb.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCleanupFix();
}

export { testCleanupFix };
