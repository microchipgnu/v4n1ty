/**
 * Search modes for vanity address generation
 */
export type SearchMode = 'anywhere' | 'start' | 'end' | 'position';

/**
 * Configuration for vanity address generation
 */
export interface GeneratorConfig {
  /** Target string to search for (without 0x prefix) */
  target: string;
  /** Search mode */
  searchMode: SearchMode;
  /** Position for 'position' search mode (0-indexed) */
  position?: number;
  /** Case sensitivity */
  caseSensitive: boolean;
  /** Number of worker threads */
  numWorkers: number;
}

/**
 * Result from worker thread
 */
export interface WorkerResult {
  type: 'found' | 'progress' | 'error';
  data?: {
    address: string;
    privateKey: string;
    attempts: number;
  };
  attempts?: number;
  error?: string;
}

/**
 * Message to worker thread
 */
export interface WorkerMessage {
  type: 'start' | 'stop';
  config?: GeneratorConfig;
}

/**
 * CLI options
 */
export interface CLIOptions {
  target: string;
  mode: SearchMode;
  position?: number;
  caseSensitive: boolean;
  workers?: number;
  verbose?: boolean;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  totalAttempts: number;
  totalTime: number;
  avgAddressesPerSecond: number;
  currentAddressesPerSecond: number;
}

/**
 * Generated vanity address result
 */
export interface VanityAddressResult {
  address: string;
  privateKey: string;
  attempts: number;
  searchTime: number;
  searchDescription: string;
} 