import WebSocket from 'ws';
import { config } from './config';

export interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params: any[];
  id: number;
}

export interface JsonRpcResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

export interface MempoolTransactionResult {
  id: string;
  status: string;
  transaction: string;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private requestId = 1;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to the WebSocket server
   */
  private async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log(`🔌 Connecting to WebSocket: ${config.nodeWebSocketUrl}`);

    try {
      this.ws = new WebSocket(config.nodeWebSocketUrl);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const response: JsonRpcResponse = JSON.parse(data.toString());
          this.handleResponse(response);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        console.log(`🔌 WebSocket closed: ${code} ${reason.toString()}`);
        this.isConnecting = false;
        this.handleDisconnection();
      });

      this.ws.on('error', (error: Error) => {
        console.error('❌ WebSocket error:', error.message);
        this.isConnecting = false;
        this.handleDisconnection();
      });

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.handleDisconnection();
    }
  }

  /**
   * Handle WebSocket disconnection and attempt reconnection
   */
  private handleDisconnection(): void {
    // Reject all pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('WebSocket connection lost'));
    }
    this.pendingRequests.clear();

    // Attempt reconnection if within limits
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);

      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Handle incoming JSON-RPC response
   */
  private handleResponse(response: JsonRpcResponse): void {
    const pendingRequest = this.pendingRequests.get(response.id);
    if (!pendingRequest) {
      console.warn(`⚠️ Received response for unknown request ID: ${response.id}`);
      return;
    }

    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pendingRequest.reject(new Error(`JSON-RPC error: ${response.error.message}`));
    } else {
      pendingRequest.resolve(response.result);
    }
  }

  /**
   * Send a JSON-RPC request and wait for response
   */
  private async sendRequest(method: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = this.requestId++;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method,
        params,
        id
      };

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, 15000); // 15 second timeout

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timeout });

      // Send request
      try {
        this.ws.send(JSON.stringify(request));
        console.log(`📤 Sent JSON-RPC request: ${method} (ID: ${id})`);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Get transaction from mempool via JSON-RPC
   */
  async getMempoolTransaction(tx_id: string): Promise<MempoolTransactionResult | null> {
    try {
      console.log(`🔍 Querying mempool for transaction: ${tx_id}`);
      const result = await this.sendRequest('mempool_get_transaction', [tx_id]);

      if (result && result.id && result.transaction) {
        console.log(`✅ Found transaction in mempool: ${tx_id}`);
        return result as MempoolTransactionResult;
      } else {
        console.log(`❓ Transaction not found in mempool: ${tx_id}`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Failed to query mempool for ${tx_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status for health checks
   */
  getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Close the WebSocket connection
   */
  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clear all pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('WebSocket client closed'));
    }
    this.pendingRequests.clear();

    console.log('🔒 WebSocket client closed');
  }
}

// Singleton instance
export const webSocketClient = new WebSocketClient();
