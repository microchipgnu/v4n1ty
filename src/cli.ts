import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { VanityGenerator } from './generator.js';
import { estimateDifficulty, formatNumber, formatTime, getSearchDescription } from './utils.js';
import type { CLIOptions, GeneratorConfig, SearchMode, PerformanceStats, VanityAddressResult } from './types.js';

/**
 * CLI interface for the vanity address generator
 */
export class CLI {
  private program: Command;
  private spinner?: ReturnType<typeof ora>;
  private generator?: VanityGenerator;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Sets up CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .name('v4n1ty')
      .description('Multi-threaded Ethereum vanity address generator')
      .version('1.0.0')
      .argument('<target>', 'Target string to search for (hexadecimal, no 0x prefix)')
      .option('-m, --mode <mode>', 'Search mode: anywhere, start, end, position', 'start')
      .option('-p, --position <number>', 'Position for position mode (0-indexed)', parseInt)
      .option('-c, --case-sensitive', 'Case sensitive search', false)
      .option('-w, --workers <number>', 'Number of worker threads', parseInt)
      .option('-v, --verbose', 'Verbose output', false)
      .option('--no-color', 'Disable colored output')
      .action((target: string, options: CLIOptions) => {
        this.run(target, options);
      });

    this.program
      .command('estimate')
      .description('Estimate difficulty and time for finding a vanity address')
      .argument('<target>', 'Target string to search for')
      .option('-m, --mode <mode>', 'Search mode: anywhere, start, end, position', 'start')
      .option('-c, --case-sensitive', 'Case sensitive search', false)
      .action((target: string, options: Omit<CLIOptions, 'workers' | 'verbose'>) => {
        this.estimate(target, options);
      });
  }

  /**
   * Runs the CLI program
   */
  public async execute(args: string[]): Promise<void> {
    try {
      await this.program.parseAsync(args);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * Main run command
   */
  private async run(target: string, options: CLIOptions): Promise<void> {
    try {
      const config = this.buildConfig(target, options);
      
      // Show configuration
      this.showConfiguration(config);
      
      // Show difficulty estimate
      this.showDifficultyEstimate(config);
      
      // Setup generator
      this.generator = new VanityGenerator(config);
      this.setupGeneratorEvents();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      // Start generation
      console.log(chalk.yellow('\n🔍 Starting vanity address generation...'));
      console.log(chalk.gray('Press Ctrl+C to stop\n'));
      
      this.generator.start();
      
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * Estimate command
   */
  private estimate(target: string, options: Omit<CLIOptions, 'workers' | 'verbose'>): void {
    try {
      const mode = this.validateSearchMode(options.mode);
      const { difficulty, description } = estimateDifficulty(target, mode, options.caseSensitive);
      
      console.log(chalk.cyan('\n🎯 Vanity Address Difficulty Estimate'));
      console.log(chalk.gray('='.repeat(50)));
      console.log(`Target: ${chalk.yellow(target)}`);
      console.log(`Mode: ${chalk.yellow(mode)}`);
      console.log(`Case Sensitive: ${chalk.yellow(options.caseSensitive ? 'Yes' : 'No')}`);
      console.log(`Difficulty: ${chalk.yellow(description)}`);
      
      // Estimate time based on typical performance
      const estimatedSpeed = 50000; // addresses per second (conservative estimate)
      const estimatedSeconds = difficulty / estimatedSpeed;
      
      console.log(`\n⏱️  Estimated time (at ~${formatNumber(estimatedSpeed)} addr/s):`);
      console.log(`   ${chalk.green(formatTime(estimatedSeconds))}`);
      
      if (estimatedSeconds > 3600) {
        console.log(chalk.yellow('\n⚠️  This may take a very long time. Consider:'));
        console.log('   • Using a shorter target string');
        console.log('   • Using "anywhere" mode instead of "start" or "end"');
        console.log('   • Using case-insensitive search');
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * Builds generator configuration from CLI options
   */
  private buildConfig(target: string, options: CLIOptions): GeneratorConfig {
    const searchMode = this.validateSearchMode(options.mode);
    
    return {
      target,
      searchMode,
      position: options.position,
      caseSensitive: options.caseSensitive,
      numWorkers: options.workers || (globalThis as any).navigator?.hardwareConcurrency || 4
    };
  }

  /**
   * Validates search mode
   */
  private validateSearchMode(mode: string): SearchMode {
    const validModes: SearchMode[] = ['anywhere', 'start', 'end', 'position'];
    if (!validModes.includes(mode as SearchMode)) {
      throw new Error(`Invalid search mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }
    return mode as SearchMode;
  }

  /**
   * Shows configuration
   */
  private showConfiguration(config: GeneratorConfig): void {
    console.log(chalk.cyan('\n🎯 Vanity Address Generator Configuration'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(`Target: ${chalk.yellow(config.target)}`);
    console.log(`Mode: ${chalk.yellow(config.searchMode)}`);
    if (config.searchMode === 'position') {
      console.log(`Position: ${chalk.yellow(config.position)}`);
    }
    console.log(`Case Sensitive: ${chalk.yellow(config.caseSensitive ? 'Yes' : 'No')}`);
    console.log(`Worker Threads: ${chalk.yellow(config.numWorkers)}`);
    console.log(`Looking for: ${chalk.yellow(getSearchDescription(config.target, config.searchMode, config.caseSensitive, config.position))}`);
  }

  /**
   * Shows difficulty estimate
   */
  private showDifficultyEstimate(config: GeneratorConfig): void {
    const { difficulty, description } = estimateDifficulty(config.target, config.searchMode, config.caseSensitive);
    console.log(chalk.cyan('\n📊 Difficulty Estimate'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(`Probability: ${chalk.yellow(description)}`);
    
    if (difficulty > 1000000) {
      console.log(chalk.yellow('⚠️  This is a difficult target that may take a long time.'));
    }
  }

  /**
   * Sets up generator event handlers
   */
  private setupGeneratorEvents(): void {
    if (!this.generator) return;

    this.generator.on('started', () => {
      this.spinner = ora('Generating vanity address...').start();
    });

    this.generator.on('progress', (stats: PerformanceStats) => {
      if (this.spinner) {
        const text = `${formatNumber(stats.totalAttempts)} attempts | ${formatNumber(Math.round(stats.avgAddressesPerSecond))} avg addr/s | ${formatNumber(Math.round(stats.currentAddressesPerSecond))} current addr/s`;
        this.spinner.text = text;
      }
    });

    this.generator.on('found', (result: VanityAddressResult) => {
      if (this.spinner) {
        this.spinner.stop();
      }
      
      this.showResult(result);
      process.exit(0);
    });

    this.generator.on('error', (error: Error) => {
      if (this.spinner) {
        this.spinner.fail('Generation failed');
      }
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    });

    this.generator.on('stopped', () => {
      if (this.spinner) {
        this.spinner.stop();
      }
    });
  }

  /**
   * Shows the final result
   */
  private showResult(result: VanityAddressResult): void {
    console.log(chalk.green('\n🎉 Vanity Address Found!'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(`${chalk.cyan('Address:')} ${chalk.yellow(result.address)}`);
    console.log(`${chalk.cyan('Private Key:')} ${chalk.yellow(result.privateKey)}`);
    console.log(`${chalk.cyan('Description:')} ${result.searchDescription}`);
    console.log(`${chalk.cyan('Total Attempts:')} ${chalk.yellow(formatNumber(result.attempts))}`);
    console.log(`${chalk.cyan('Search Time:')} ${chalk.yellow(formatTime(result.searchTime))}`);
    
    console.log(chalk.gray('\n⚠️  Security Warning:'));
    console.log(chalk.gray('• Keep your private key secure and never share it'));
    console.log(chalk.gray('• Consider using a hardware wallet for large amounts'));
    console.log(chalk.gray('• This tool is for educational/vanity purposes only'));
  }

  /**
   * Sets up graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = () => {
      console.log(chalk.yellow('\n\n🛑 Shutting down gracefully...'));
      
      if (this.generator) {
        this.generator.stop();
      }
      
      if (this.spinner) {
        this.spinner.stop();
      }
      
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
} 