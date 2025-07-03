import axios, { AxiosResponse } from 'axios';
import { config } from './config';
import { NodeSubmitResponse, NodeGetResponse } from './types';

export class NodeClient {
  
  /**
   * Submit a transaction to the Mintlayer node
   * @param encodedTransaction - Hex-encoded transaction
   * @returns Node response with tx_id
   */
  static async submitTransaction(encodedTransaction: string): Promise<NodeSubmitResponse> {
    console.log(`📤 Submitting transaction to node: ${config.nodePostTransactionUrl}`);
    
    try {
      const response: AxiosResponse = await axios.post(
        config.nodePostTransactionUrl,
        encodedTransaction,
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log(`✅ Node response received:`, response.status);
      
      // Handle different response formats from the node
      let nodeResponse: NodeSubmitResponse;
      
      if (typeof response.data === 'string') {
        // If response is just a string (tx_id)
        nodeResponse = { tx_id: response.data.trim() };
      } else if (typeof response.data === 'object') {
        // If response is JSON object
        nodeResponse = response.data;
      } else {
        throw new Error('Unexpected response format from node');
      }

      console.log(`🆔 Transaction ID: ${nodeResponse.tx_id || nodeResponse.txid}`);
      return nodeResponse;

    } catch (error: any) {
      console.error('❌ Failed to submit transaction to node:', error.message);
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        throw new Error(`Node error (${error.response.status}): ${error.response.data}`);
      } else if (error.request) {
        throw new Error('No response from node - check node URL and connectivity');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  /**
   * Get transaction details from the Mintlayer node
   * @param tx_id - Transaction ID to lookup
   * @returns Node response with transaction details or null if not found
   */
  static async getTransaction(tx_id: string): Promise<NodeGetResponse | null> {
    const getUrl = config.nodeGetTransactionUrl || config.nodePostTransactionUrl;
    console.log(`📥 Getting transaction from node: ${getUrl}/${tx_id}`);
    
    try {
      const response: AxiosResponse = await axios.get(
        `${getUrl}/${tx_id}`,
        {
          timeout: 15000, // 15 second timeout
        }
      );

      console.log(`✅ Node GET response received:`, response.status);
      return response.data;

    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log(`🔍 Transaction not found on node: ${tx_id}`);
        return null;
      }
      
      console.error('❌ Failed to get transaction from node:', error.message);
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        throw new Error(`Node error (${error.response.status}): ${error.response.data}`);
      } else if (error.request) {
        throw new Error('No response from node - check node URL and connectivity');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  /**
   * Check if the node is reachable
   */
  static async healthCheck(): Promise<boolean> {
    try {
      console.log(`🏥 Checking node health: ${config.nodePostTransactionUrl}`);
      
      // Try a simple request to check connectivity
      const response = await axios.get(config.nodePostTransactionUrl, {
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      
      console.log(`✅ Node is reachable (status: ${response.status})`);
      return true;
      
    } catch (error: any) {
      console.error('❌ Node health check failed:', error.message);
      return false;
    }
  }
}
