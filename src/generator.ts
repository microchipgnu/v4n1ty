import { EventEmitter } from 'events';
import { createWorker, terminateWorker } from './worker.js';
import { calculatePerformanceStats, getSearchDescription, validateConfig } from './utils.js';
import type { GeneratorConfig, WorkerResult, VanityAddressResult, PerformanceStats } from './types.js';

/**
 * Events emitted by the VanityGenerator
 */
export interface GeneratorEvents {
  'progress': (stats: PerformanceStats) => void;
  'found': (result: VanityAddressResult) => void;
  'error': (error: Error) => void;
  'started': () => void;
  'stopped': () => void;
}

/**
 * Multi-threaded vanity address generator
 */
export class VanityGenerator extends EventEmitter {
  private config: GeneratorConfig;
  private workers: Worker[] = [];
  private isRunning = false;
  private totalAttempts = 0;
  private startTime = 0;
  private lastUpdateTime = 0;
  private lastUpdateAttempts = 0;
  private progressInterval?: NodeJS.Timeout;

  constructor(config: GeneratorConfig) {
    super();
    this.config = config;
    this.validateConfiguration();
  }

  /**
   * Validates the generator configuration
   */
  private validateConfiguration(): void {
    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Starts the vanity address generation
   */
  public start(): void {
    if (this.isRunning) {
      throw new Error('Generator is already running');
    }

    this.isRunning = true;
    this.totalAttempts = 0;
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    this.lastUpdateAttempts = 0;

    this.createWorkers();
    this.startProgressUpdates();
    this.emit('started');
  }

  /**
   * Stops the vanity address generation
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.terminateAllWorkers();
    this.stopProgressUpdates();
    this.emit('stopped');
  }

  /**
   * Creates and starts worker threads
   */
  private createWorkers(): void {
    for (let i = 0; i < this.config.numWorkers; i++) {
      const worker = createWorker(
        this.config,
        (result: WorkerResult) => this.handleWorkerMessage(result),
        (error: Error) => this.handleWorkerError(error)
      );
      
      this.workers.push(worker);
    }
  }

  /**
   * Handles messages from worker threads
   */
  private handleWorkerMessage(result: WorkerResult): void {
    if (!this.isRunning) {
      return;
    }

    switch (result.type) {
      case 'found':
        if (result.data) {
          this.handleFoundResult(result.data);
        }
        break;
      case 'progress':
        if (result.attempts) {
          this.totalAttempts += result.attempts;
        }
        break;
      case 'error':
        this.emit('error', new Error(result.error || 'Unknown worker error'));
        break;
    }
  }

  /**
   * Handles when a vanity address is found
   */
  private handleFoundResult(data: { address: string; privateKey: string; attempts: number }): void {
    this.totalAttempts += data.attempts;
    const searchTime = (Date.now() - this.startTime) / 1000;
    
    const result: VanityAddressResult = {
      address: data.address,
      privateKey: data.privateKey,
      attempts: this.totalAttempts,
      searchTime,
      searchDescription: getSearchDescription(
        this.config.target,
        this.config.searchMode,
        this.config.caseSensitive,
        this.config.position
      )
    };

    this.stop();
    this.emit('found', result);
  }

  /**
   * Handles worker errors
   */
  private handleWorkerError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Starts periodic progress updates
   */
  private startProgressUpdates(): void {
    this.progressInterval = setInterval(() => {
      if (this.isRunning) {
        const stats = calculatePerformanceStats(
          this.totalAttempts,
          this.startTime,
          this.lastUpdateTime,
          this.lastUpdateAttempts
        );
        
        this.lastUpdateTime = Date.now();
        this.lastUpdateAttempts = this.totalAttempts;
        
        this.emit('progress', stats);
      }
    }, 1000); // Update every second
  }

  /**
   * Stops periodic progress updates
   */
  private stopProgressUpdates(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
  }

  /**
   * Terminates all worker threads
   */
  private terminateAllWorkers(): void {
    this.workers.forEach(worker => terminateWorker(worker));
    this.workers = [];
  }

  /**
   * Gets the current configuration
   */
  public getConfig(): GeneratorConfig {
    return { ...this.config };
  }

  /**
   * Gets the current running state
   */
  public isGenerating(): boolean {
    return this.isRunning;
  }

  /**
   * Gets current statistics
   */
  public getStats(): PerformanceStats {
    return calculatePerformanceStats(
      this.totalAttempts,
      this.startTime,
      this.lastUpdateTime,
      this.lastUpdateAttempts
    );
  }
}

// Add type declaration for EventEmitter
export declare interface VanityGenerator {
  on<K extends keyof GeneratorEvents>(event: K, listener: GeneratorEvents[K]): this;
  emit<K extends keyof GeneratorEvents>(event: K, ...args: Parameters<GeneratorEvents[K]>): boolean;
} 