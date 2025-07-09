import type { SearchMode, GeneratorConfig, PerformanceStats } from './types.js';

/**
 * Validates a hexadecimal target string
 */
export function validateTarget(target: string): boolean {
  return /^[0-9a-fA-F]+$/.test(target);
}

/**
 * Validates the position parameter for position search mode
 */
export function validatePosition(position: number, targetLength: number): boolean {
  return position >= 0 && position <= (40 - targetLength); // 40 chars in address without 0x
}

/**
 * Gets a human-readable description of the search criteria
 */
export function getSearchDescription(
  target: string,
  mode: SearchMode,
  caseSensitive: boolean,
  position?: number
): string {
  const caseNote = caseSensitive ? ' (case-sensitive)' : ' (case-insensitive)';
  
  switch (mode) {
    case 'anywhere':
      return `containing "${target}" anywhere${caseNote}`;
    case 'start':
      return `starting with "${target}"${caseNote}`;
    case 'end':
      return `ending with "${target}"${caseNote}`;
    case 'position':
      return `with "${target}" at position ${position}${caseNote}`;
    default:
      return `matching "${target}"${caseNote}`;
  }
}

/**
 * Formats a number with locale-appropriate thousands separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Formats elapsed time in a human-readable format
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Calculates performance statistics
 */
export function calculatePerformanceStats(
  totalAttempts: number,
  startTime: number,
  lastUpdateTime: number,
  lastUpdateAttempts: number
): PerformanceStats {
  const currentTime = Date.now();
  const totalTime = (currentTime - startTime) / 1000;
  const intervalTime = (currentTime - lastUpdateTime) / 1000;
  
  const avgAddressesPerSecond = totalAttempts / totalTime;
  const currentAddressesPerSecond = (totalAttempts - lastUpdateAttempts) / intervalTime;
  
  return {
    totalAttempts,
    totalTime,
    avgAddressesPerSecond,
    currentAddressesPerSecond
  };
}

/**
 * Validates the generator configuration
 */
export function validateConfig(config: GeneratorConfig): string[] {
  const errors: string[] = [];
  
  if (!config.target || config.target.length === 0) {
    errors.push('Target string cannot be empty');
  }
  
  if (!validateTarget(config.target)) {
    errors.push('Target must contain only hexadecimal characters (0-9, a-f, A-F)');
  }
  
  if (config.target.length > 40) {
    errors.push('Target cannot be longer than 40 characters');
  }
  
  if (config.searchMode === 'position') {
    if (config.position === undefined) {
      errors.push('Position must be specified for position search mode');
    } else if (!validatePosition(config.position, config.target.length)) {
      errors.push(`Position must be between 0 and ${40 - config.target.length} for target length ${config.target.length}`);
    }
  }
  
  if (config.numWorkers < 1) {
    errors.push('Number of workers must be at least 1');
  }
  
  return errors;
}

/**
 * Estimates the difficulty of finding a vanity address
 */
export function estimateDifficulty(target: string, mode: SearchMode, caseSensitive: boolean): {
  difficulty: number;
  description: string;
} {
  const targetLength = target.length;
  const base = caseSensitive ? 16 : 16; // Hex base
  
  let difficulty: number;
  let description: string;
  
  switch (mode) {
    case 'start':
      difficulty = Math.pow(base, targetLength);
      description = `~1 in ${formatNumber(difficulty)}`;
      break;
    case 'end':
      difficulty = Math.pow(base, targetLength);
      description = `~1 in ${formatNumber(difficulty)}`;
      break;
    case 'position':
      difficulty = Math.pow(base, targetLength);
      description = `~1 in ${formatNumber(difficulty)}`;
      break;
    case 'anywhere':
      // More complex calculation for anywhere mode
      difficulty = Math.pow(base, targetLength) / (40 - targetLength + 1);
      description = `~1 in ${formatNumber(Math.round(difficulty))}`;
      break;
    default:
      difficulty = Math.pow(base, targetLength);
      description = `~1 in ${formatNumber(difficulty)}`;
  }
  
  return { difficulty, description };
} 