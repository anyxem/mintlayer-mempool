import { TransactionService } from './transaction-service';

/**
 * Test Phase 1: Shallow metadata validation
 * Tests the new validation logic for standardized metadata format
 */

async function testMetadataValidation() {
  console.log('🧪 Testing Phase 1: Shallow Metadata Validation');
  console.log('=' .repeat(60));

  const service = new TransactionService();

  // Test cases for metadata validation
  const testCases = [
    {
      name: 'Valid Standard Metadata',
      transaction: 'deadbeef12345678',
      metadata: {
        inputs: [
          {
            input: {
              index: 0,
              source_type: 0,
              source_id: '513932890fb1fee9b21d3004d4292e7eace8753f43d601013d635b8b1195f207',
              input_type: 'UTXO',
            },
            utxo: {
              type: 'Transfer',
              destination: 'tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7',
              value: {
                amount: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
                type: 'Coin',
              },
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
            value: {
              type: 'Coin',
              amount: {
                decimal: '10',
                atoms: '1000000000000',
              },
            },
          },
        ],
        fee: {
          atoms: '34500000000',
          decimal: '0.345',
        },
        id: '63c90b6d244cdf901322fa7e75fb6499a8e7a30152d573626e5a10b06befe65a',
      },
      shouldPass: true
    },
    {
      name: 'Missing inputs field',
      transaction: 'deadbeef12345678',
      metadata: {
        outputs: [
          {
            type: 'Transfer',
            destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
            value: {
              type: 'Coin',
              amount: {
                decimal: '10',
                atoms: '1000000000000',
              },
            },
          },
        ],
        fee: {
          atoms: '34500000000',
          decimal: '0.345',
        },
        id: '63c90b6d244cdf901322fa7e75fb6499a8e7a30152d573626e5a10b06befe65a',
      },
      shouldPass: false
    },
    {
      name: 'Empty inputs array',
      transaction: 'deadbeef12345678',
      metadata: {
        inputs: [],
        outputs: [
          {
            type: 'Transfer',
            destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
            value: {
              type: 'Coin',
              amount: {
                decimal: '10',
                atoms: '1000000000000',
              },
            },
          },
        ],
        fee: {
          atoms: '34500000000',
          decimal: '0.345',
        },
        id: '63c90b6d244cdf901322fa7e75fb6499a8e7a30152d573626e5a10b06befe65a',
      },
      shouldPass: false
    },
    {
      name: 'Invalid fee structure',
      transaction: 'deadbeef12345678',
      metadata: {
        inputs: [
          {
            input: {
              index: 0,
              source_type: 0,
              source_id: '513932890fb1fee9b21d3004d4292e7eace8753f43d601013d635b8b1195f207',
              input_type: 'UTXO',
            },
            utxo: {
              type: 'Transfer',
              destination: 'tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7',
              value: {
                amount: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
                type: 'Coin',
              },
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
            value: {
              type: 'Coin',
              amount: {
                decimal: '10',
                atoms: '1000000000000',
              },
            },
          },
        ],
        fee: '34500000000', // Should be object, not string
        id: '63c90b6d244cdf901322fa7e75fb6499a8e7a30152d573626e5a10b06befe65a',
      },
      shouldPass: false
    },
    {
      name: 'Missing id field',
      transaction: 'deadbeef12345678',
      metadata: {
        inputs: [
          {
            input: {
              index: 0,
              source_type: 0,
              source_id: '513932890fb1fee9b21d3004d4292e7eace8753f43d601013d635b8b1195f207',
              input_type: 'UTXO',
            },
            utxo: {
              type: 'Transfer',
              destination: 'tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7',
              value: {
                amount: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
                type: 'Coin',
              },
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
            value: {
              type: 'Coin',
              amount: {
                decimal: '10',
                atoms: '1000000000000',
              },
            },
          },
        ],
        fee: {
          atoms: '34500000000',
          decimal: '0.345',
        },
        // Missing id field
      } as any,
      shouldPass: false
    },
    {
      name: 'No metadata',
      transaction: 'deadbeef12345678',
      metadata: undefined,
      shouldPass: true
    }
  ];

  // Run test cases
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. Testing: ${testCase.name}`);
    
    try {
      // Mock node response
      const mockNodeResponse = {
        tx_id: `test-validation-${i + 1}-${Date.now()}`,
        status: 'accepted'
      };

      // Process transaction with metadata
      const result = await service.processTransaction({
        transaction: testCase.transaction,
        metadata: testCase.metadata
      }, mockNodeResponse);

      if (testCase.shouldPass) {
        console.log(`   ✅ PASS: Transaction processed successfully: ${result.tx_id}`);
      } else {
        console.log(`   ❌ FAIL: Expected validation error but transaction passed: ${result.tx_id}`);
      }

    } catch (error: any) {
      if (!testCase.shouldPass) {
        console.log(`   ✅ PASS: Expected validation error: ${error.message}`);
      } else {
        console.log(`   ❌ FAIL: Unexpected error: ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Metadata validation testing completed');
}

// Run the test
if (require.main === module) {
  testMetadataValidation().catch(console.error);
}

export { testMetadataValidation };
