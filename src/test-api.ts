import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Submit transaction (JSON format)
    console.log('\n2️⃣ Testing transaction submission (JSON)...');
    const jsonTransaction = {
      transaction: '0100000001a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890000000006a47304402203e4516da7253cf068effec6b95c41221c0cf3a8e6ccb8cbf1725b562e9afde2c022054e1c258c2981cdfba5df64e841288f76c5c8e8c1c1e1c1e1c1e1c1e1c1e1c1e012103ad1d8e89212f0b92c74d23bb710c00662451716a435b97381a1a2e4a98f5d9b1ffffffff0100e1f50500000000196a17a91489abcdefabbaabbaabbaabbaabbaabbaabbaabba8700000000',
      metadata: {
        amount: 100000000,
        recipient: 'test-address-json',
        fee: 1000,
        note: 'Test transaction via JSON'
      }
    };

    try {
      const submitResponse = await axios.post(`${API_BASE}/api/transaction`, jsonTransaction, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ JSON transaction submitted:', submitResponse.data);
      
      const txId = submitResponse.data.tx_id;
      
      // Test 3: Get transaction details
      console.log('\n3️⃣ Testing transaction retrieval...');
      const getResponse = await axios.get(`${API_BASE}/api/transaction/${txId}`);
      console.log('✅ Transaction retrieved:', getResponse.data);
      
    } catch (submitError: any) {
      console.log('⚠️ Transaction submission failed (expected if no node):', submitError.response?.data || submitError.message);
    }

    // Test 4: Submit transaction (text/plain format)
    console.log('\n4️⃣ Testing transaction submission (text/plain)...');
    const rawTransaction = '0200000001b3c4d5e6f7890123456789012345678901234567890123456789012345678901234567890000000006b483045022100f2f6e1e77f5e5d5c5b5a59585756555453525150494847464544434241403f3e022020c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0012103ad1d8e89212f0b92c74d23bb710c00662451716a435b97381a1a2e4a98f5d9b1ffffffff0200e1f50500000000196a17a91489abcdefabbaabbaabbaabbaabbaabbaabbaabba8700e40b54020000001976a914c398efa9c392ba6013c5e04ee729755ef7f58b3288ac00000000';

    try {
      const rawSubmitResponse = await axios.post(`${API_BASE}/api/transaction`, rawTransaction, {
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log('✅ Raw transaction submitted:', rawSubmitResponse.data);
    } catch (rawSubmitError: any) {
      console.log('⚠️ Raw transaction submission failed (expected if no node):', rawSubmitError.response?.data || rawSubmitError.message);
    }

    // Test 5: Get pending transactions
    console.log('\n5️⃣ Testing pending transactions list...');
    const pendingResponse = await axios.get(`${API_BASE}/api/transactions/pending`);
    console.log('✅ Pending transactions:', pendingResponse.data);

    // Test 6: Test non-existent transaction
    console.log('\n6️⃣ Testing non-existent transaction lookup...');
    try {
      const notFoundResponse = await axios.get(`${API_BASE}/api/transaction/non-existent-tx-id`);
      console.log('❓ Unexpected success:', notFoundResponse.data);
    } catch (notFoundError: any) {
      if (notFoundError.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent transaction');
      } else {
        console.log('❌ Unexpected error:', notFoundError.response?.data || notFoundError.message);
      }
    }

    // Test 7: Test invalid endpoint
    console.log('\n7️⃣ Testing invalid endpoint...');
    try {
      const invalidResponse = await axios.get(`${API_BASE}/api/invalid-endpoint`);
      console.log('❓ Unexpected success:', invalidResponse.data);
    } catch (invalidError: any) {
      if (invalidError.response?.status === 404) {
        console.log('✅ Correctly returned 404 for invalid endpoint');
      } else {
        console.log('❌ Unexpected error:', invalidError.response?.data || invalidError.message);
      }
    }

    console.log('\n🎉 API tests completed!');
    console.log('\n📝 Note: Transaction submissions may fail if Mintlayer node is not running.');
    console.log('   This is expected behavior - the proxy will return appropriate errors.');

  } catch (error: any) {
    console.error('❌ API test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the API server is running: npm run dev');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

export { testAPI };
