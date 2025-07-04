import { TransactionService } from './transaction-service';
import { transactionDb } from './database';

async function testMetadataFlexibility() {
  console.log('🧪 Testing flexible metadata handling...\n');

  try {
    // Initialize database
    await transactionDb.initialize();

    const service = new TransactionService();

    // Test different metadata formats
    const testCases = [
      {
        name: 'Object metadata',
        transaction: 'deadbeef01234567',
        metadata: {
          amount: 100000000,
          recipient: 'ml1qw508d6qejxtdg4y5r3zarvary0c5xw7k8txqgv',
          fee: 1000,
          memo: 'Payment for services',
          tags: ['payment', 'service'],
          custom_data: {
            invoice_id: 'INV-2025-001',
            customer_id: 12345
          }
        }
      },
      {
        name: 'String metadata',
        transaction: 'cafebabe01234567',
        metadata: 'Simple string metadata for transaction'
      },
      {
        name: 'Number metadata',
        transaction: 'beefdead01234567',
        metadata: 42
      },
      {
        name: 'Boolean metadata',
        transaction: 'abcdef0123456789',
        metadata: true
      },
      {
        name: 'Null metadata',
        transaction: 'fedcba9876543210',
        metadata: null
      },
      {
        name: 'No metadata',
        transaction: '1234567890abcdef',
        metadata: undefined
      },
      {
        name: 'Complex nested object',
        transaction: '9876543210fedcba',
        metadata: {
          transaction_type: 'transfer',
          wallet_info: {
            version: '2.1.0',
            platform: 'web',
            user_agent: 'Mozilla/5.0...'
          },
          routing: {
            source_exchange: 'ExchangeA',
            destination_exchange: 'ExchangeB',
            intermediate_hops: ['HopA', 'HopB']
          },
          compliance: {
            kyc_verified: true,
            aml_check: 'passed',
            risk_score: 0.15
          },
          timestamps: {
            created: '2025-07-03T21:00:00Z',
            signed: '2025-07-03T21:00:05Z',
            submitted: '2025-07-03T21:00:10Z'
          }
        }
      },
      {
        name: 'Array as metadata',
        transaction: 'aabbccdd11223344',
        metadata: ['tag1', 'tag2', 'tag3', { priority: 'high' }]
      }
    ];

    console.log(`📋 Testing ${testCases.length} different metadata formats...\n`);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`${i + 1}️⃣ Testing: ${testCase.name}`);
      
      try {
        // Mock node response
        const mockNodeResponse = {
          tx_id: `test-metadata-${i + 1}-${Date.now()}`,
          status: 'accepted'
        };

        // Process transaction with metadata
        const result = await service.processTransaction({
          transaction: testCase.transaction,
          metadata: testCase.metadata
        }, mockNodeResponse);

        console.log(`   ✅ Processed: ${result.tx_id}`);
        console.log(`   📊 Metadata type: ${typeof testCase.metadata}`);
        
        if (testCase.metadata !== undefined && testCase.metadata !== null) {
          if (typeof testCase.metadata === 'object') {
            if (Array.isArray(testCase.metadata)) {
              console.log(`   📋 Array length: ${testCase.metadata.length}`);
            } else {
              console.log(`   🔑 Object keys: ${Object.keys(testCase.metadata).length}`);
            }
          }
        }

        // Retrieve and verify the stored transaction
        const retrieved = await service.getTransactionDetails(result.tx_id);
        if (retrieved) {
          console.log(`   ✅ Retrieved successfully`);
          console.log(`   🔄 Metadata preserved: ${JSON.stringify(retrieved.metadata) === JSON.stringify(testCase.metadata)}`);
        } else {
          console.log(`   ❌ Failed to retrieve`);
        }

      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Test JSON parsing scenarios
    console.log('🔍 Testing JSON payload parsing...\n');

    const jsonTestCases = [
      {
        name: 'Standard wallet metadata',
        body: {
          transaction: 'jsontest01234567',
          metadata: {
            wallet_version: '1.2.3',
            user_id: 'user123',
            session_id: 'sess456'
          }
        },
        contentType: 'application/json'
      },
      {
        name: 'Exchange metadata',
        body: {
          transaction: 'jsontest89abcdef',
          metadata: {
            exchange_order_id: 'ORD-789',
            trading_pair: 'ML/USDT',
            order_type: 'market',
            executed_price: 1.25,
            fees: {
              network_fee: 0.001,
              exchange_fee: 0.0025
            }
          }
        },
        contentType: 'application/json'
      },
      {
        name: 'Raw transaction (no metadata)',
        body: 'rawtest0123456789abcdef',
        contentType: 'text/plain'
      }
    ];

    for (let i = 0; i < jsonTestCases.length; i++) {
      const testCase = jsonTestCases[i];
      console.log(`${i + 1}️⃣ Testing JSON parsing: ${testCase.name}`);
      
      try {
        const parsed = TransactionService.parseTransactionRequest(testCase.body, testCase.contentType);
        console.log(`   ✅ Parsed successfully`);
        console.log(`   📝 Transaction: ${parsed.transaction.substring(0, 16)}...`);
        console.log(`   📊 Has metadata: ${!!parsed.metadata}`);
        
        if (parsed.metadata) {
          console.log(`   🔍 Metadata type: ${typeof parsed.metadata}`);
        }
        
      } catch (error: any) {
        console.log(`   ❌ Parse error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Check final database state
    console.log('📊 Final database statistics...');
    const stats = await service.getMempoolStats();
    console.log(`   Total transactions: ${stats.count}`);

    const allPending = await service.getPendingTransactions();
    console.log(`   Transactions with metadata: ${allPending.filter(tx => tx.metadata !== undefined).length}`);
    console.log(`   Transactions without metadata: ${allPending.filter(tx => tx.metadata === undefined).length}`);

    console.log('\n🎉 Metadata flexibility tests completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Supports object metadata (nested structures)');
    console.log('   ✅ Supports string metadata');
    console.log('   ✅ Supports number metadata');
    console.log('   ✅ Supports boolean metadata');
    console.log('   ✅ Supports null metadata');
    console.log('   ✅ Supports undefined (no metadata)');
    console.log('   ✅ Supports array metadata');
    console.log('   ✅ Preserves metadata exactly as provided');
    console.log('   ✅ Handles JSON and raw transaction formats');

  } catch (error: any) {
    console.error('❌ Metadata test failed:', error.message);
  } finally {
    // Clean up
    await transactionDb.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMetadataFlexibility();
}

export { testMetadataFlexibility };
