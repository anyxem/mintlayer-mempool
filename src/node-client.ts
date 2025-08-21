import axios, { AxiosResponse } from 'axios';
import { config } from './config';
import { NodeGetResponse } from './types';

export class NodeClient {

  /**
   * Get transaction details from the Mintlayer node (confirmed transactions)
   * @param tx_id - Transaction ID to lookup
   * @returns Node response with transaction details or null if not found
   */
  static async getTransaction(tx_id: string): Promise<NodeGetResponse | null> {
    if (!config.nodeGetTransactionUrl) {
      console.log('⚠️ Node GET URL not configured, skipping confirmed transaction lookup');
      return null;
    }

    console.log(`📥 Getting confirmed transaction from node: ${config.nodeGetTransactionUrl}/${tx_id}`);

    try {
      console.log('`${config.nodeGetTransactionUrl}/${tx_id}`', `${config.nodeGetTransactionUrl}/${tx_id}`);
      const response: AxiosResponse = await axios.get(
        `${config.nodeGetTransactionUrl}/${tx_id}`,
        {
          timeout: 15000, // 15 second timeout
        }
      );

      console.log(`✅ Node GET response received:`, response.status);
      return response.data;

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`🔍 Transaction not found on node: ${tx_id}`);
        return null;
      }
      
      console.error(`❌ Node GET request failed for ${tx_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if the node is reachable
   */
  static async healthCheck(): Promise<boolean> {
    if (!config.nodeGetTransactionUrl) {
      console.log('⚠️ Node GET URL not configured, skipping health check');
      return false;
    }

    try {
      console.log(`🏥 Checking node health: ${config.nodeGetTransactionUrl}`);

      // Try a simple request to check connectivity
      const response = await axios.get(config.nodeGetTransactionUrl, {
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
