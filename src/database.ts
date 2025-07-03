import sqlite3 from 'sqlite3';
import { StoredTransaction } from './types';
import { config } from './config';
import { promises as fs } from 'fs';
import path from 'path';

export class TransactionDatabase {
  private db: sqlite3.Database | null = null;

  /**
   * Initialize the database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      // Ensure the directory exists
      const dbDir = path.dirname(config.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      console.log(`📁 Initializing database at: ${config.dbPath}`);
      
      this.db = new sqlite3.Database(config.dbPath);
      
      await this.createTables();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create the transactions table if it doesn't exist
   */
  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS transactions (
          tx_id TEXT PRIMARY KEY,
          encoded_transaction TEXT NOT NULL,
          json_metadata TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'accepted',
          node_response TEXT
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📋 Transactions table ready');
          resolve();
        }
      });
    });
  }

  /**
   * Save a transaction to the database
   */
  async saveTransaction(transaction: Omit<StoredTransaction, 'timestamp'>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const insertSQL = `
        INSERT OR REPLACE INTO transactions 
        (tx_id, encoded_transaction, json_metadata, status, node_response)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        transaction.tx_id,
        transaction.encoded_transaction,
        transaction.json_metadata ? JSON.stringify(transaction.json_metadata) : null,
        transaction.status,
        transaction.node_response ? JSON.stringify(transaction.node_response) : null
      ];

      this.db.run(insertSQL, params, function(err) {
        if (err) {
          console.error('❌ Failed to save transaction:', err);
          reject(err);
        } else {
          console.log(`💾 Transaction saved: ${transaction.tx_id}`);
          resolve();
        }
      });
    });
  }

  /**
   * Get a transaction by tx_id
   */
  async getTransaction(tx_id: string): Promise<StoredTransaction | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const selectSQL = `
        SELECT tx_id, encoded_transaction, json_metadata, timestamp, status, node_response
        FROM transactions 
        WHERE tx_id = ?
      `;

      this.db.get(selectSQL, [tx_id], (err, row: any) => {
        if (err) {
          console.error('❌ Failed to get transaction:', err);
          reject(err);
        } else if (row) {
          const transaction: StoredTransaction = {
            tx_id: row.tx_id,
            encoded_transaction: row.encoded_transaction,
            json_metadata: row.json_metadata ? JSON.parse(row.json_metadata) : undefined,
            timestamp: new Date(row.timestamp),
            status: row.status,
            node_response: row.node_response ? JSON.parse(row.node_response) : undefined
          };
          console.log(`📖 Transaction retrieved: ${tx_id}`);
          resolve(transaction);
        } else {
          console.log(`🔍 Transaction not found: ${tx_id}`);
          resolve(null);
        }
      });
    });
  }

  /**
   * Get all pending (accepted) transactions
   */
  async getPendingTransactions(): Promise<StoredTransaction[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const selectSQL = `
        SELECT tx_id, encoded_transaction, json_metadata, timestamp, status, node_response
        FROM transactions 
        WHERE status = 'accepted'
        ORDER BY timestamp DESC
      `;

      this.db.all(selectSQL, [], (err, rows: any[]) => {
        if (err) {
          console.error('❌ Failed to get pending transactions:', err);
          reject(err);
        } else {
          const transactions: StoredTransaction[] = rows.map(row => ({
            tx_id: row.tx_id,
            encoded_transaction: row.encoded_transaction,
            json_metadata: row.json_metadata ? JSON.parse(row.json_metadata) : undefined,
            timestamp: new Date(row.timestamp),
            status: row.status,
            node_response: row.node_response ? JSON.parse(row.node_response) : undefined
          }));
          console.log(`📋 Retrieved ${transactions.length} pending transactions`);
          resolve(transactions);
        }
      });
    });
  }

  /**
   * Remove a transaction from the database (when confirmed)
   */
  async removeTransaction(tx_id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const deleteSQL = `DELETE FROM transactions WHERE tx_id = ?`;

      this.db.run(deleteSQL, [tx_id], function(err) {
        if (err) {
          console.error('❌ Failed to remove transaction:', err);
          reject(err);
        } else {
          const removed = this.changes > 0;
          if (removed) {
            console.log(`🗑️ Transaction removed from mempool: ${tx_id}`);
          } else {
            console.log(`🔍 Transaction not found for removal: ${tx_id}`);
          }
          resolve(removed);
        }
      });
    });
  }

  /**
   * Get transaction count
   */
  async getTransactionCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const countSQL = `SELECT COUNT(*) as count FROM transactions`;

      this.db.get(countSQL, [], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('🔒 Database connection closed');
          this.db = null;
          resolve();
        }
      });
    });
  }
}

// Singleton instance
export const transactionDb = new TransactionDatabase();
