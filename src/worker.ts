import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { WorkerMessage, WorkerResult, GeneratorConfig, SearchMode } from './types.js';

/**
 * Checks if an address matches the target criteria
 */
function matchesTarget(
  address: string,
  target: string,
  mode: SearchMode,
  caseSensitive: boolean,
  position?: number
): boolean {
  const addr = address.slice(2); // Remove '0x' prefix
  const processedAddr = caseSensitive ? addr : addr.toLowerCase();
  const processedTarget = caseSensitive ? target : target.toLowerCase();
  
  switch (mode) {
    case 'anywhere':
      return processedAddr.includes(processedTarget);
    case 'start':
      return processedAddr.startsWith(processedTarget);
    case 'end':
      return processedAddr.endsWith(processedTarget);
    case 'position':
      if (position === undefined) return false;
      return processedAddr.slice(position, position + processedTarget.length) === processedTarget;
    default:
      throw new Error(`Unknown search mode: ${mode}`);
  }
}

/**
 * Worker script that generates vanity addresses
 */
export function createWorkerScript(): string {
  return `
    import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

    // Copy the matchesTarget function into the worker
    function matchesTarget(address, target, mode, caseSensitive, position) {
      const addr = address.slice(2);
      const processedAddr = caseSensitive ? addr : addr.toLowerCase();
      const processedTarget = caseSensitive ? target : target.toLowerCase();
      
      switch (mode) {
        case 'anywhere':
          return processedAddr.includes(processedTarget);
        case 'start':
          return processedAddr.startsWith(processedTarget);
        case 'end':
          return processedAddr.endsWith(processedTarget);
        case 'position':
          if (position === undefined) return false;
          return processedAddr.slice(position, position + processedTarget.length) === processedTarget;
        default:
          throw new Error(\`Unknown search mode: \${mode}\`);
      }
    }

    let shouldStop = false;
    let attempts = 0;
    const PROGRESS_INTERVAL = 1000;

    self.onmessage = function(e) {
      const message = e.data;
      
      if (message.type === 'start') {
        const config = message.config;
        
        try {
          while (!shouldStop) {
            const priv = generatePrivateKey();
            const account = privateKeyToAccount(priv);
            
            if (matchesTarget(account.address, config.target, config.searchMode, config.caseSensitive, config.position)) {
              self.postMessage({
                type: 'found',
                data: {
                  address: account.address,
                  privateKey: priv,
                  attempts: attempts + 1
                }
              });
              break;
            }
            
            attempts++;
            
            if (attempts % PROGRESS_INTERVAL === 0) {
              self.postMessage({
                type: 'progress',
                attempts: PROGRESS_INTERVAL
              });
              attempts = 0;
            }
          }
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error.message
          });
        }
      } else if (message.type === 'stop') {
        shouldStop = true;
      }
    };
  `;
}

/**
 * Creates a new worker for vanity address generation
 */
export function createWorker(
  config: GeneratorConfig,
  onMessage: (result: WorkerResult) => void,
  onError: (error: Error) => void
): Worker {
  const workerScript = createWorkerScript();
  const worker = new Worker(
    URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }))
  );
  
  worker.onmessage = (e) => {
    const result: WorkerResult = e.data;
    onMessage(result);
  };
  
  worker.onerror = (error) => {
    onError(new Error(`Worker error: ${error.message}`));
  };
  
  // Start the worker
  const message: WorkerMessage = {
    type: 'start',
    config
  };
  worker.postMessage(message);
  
  return worker;
}

/**
 * Terminates a worker safely
 */
export function terminateWorker(worker: Worker): void {
  const message: WorkerMessage = { type: 'stop' };
  worker.postMessage(message);
  worker.terminate();
} 