# V4N1TY - Ethereum Vanity Address Generator

![image](https://github.com/user-attachments/assets/ff23ce54-45bf-4cfe-9fb3-d0a4c422898e)

A fast, multi-threaded Ethereum vanity address generator built with TypeScript and Bun.

## 🚀 Features

- **Multi-threaded**: Utilizes all CPU cores for maximum performance
- **Multiple search modes**: Find patterns at the start, end, anywhere, or specific positions
- **Case-sensitive/insensitive**: Flexible pattern matching options
- **Real-time progress**: Live performance statistics and progress updates
- **Difficulty estimation**: Estimate time and probability before starting
- **Beautiful CLI**: Modern, colorful command-line interface
- **Secure**: Generates cryptographically secure private keys

## 📦 Installation

### Prerequisites

- Node.js 18+ (for npm installation)
- [Bun](https://bun.sh/) (recommended for development)

### Install from npm (recommended)

```bash
# Install globally
npm install -g v4n1ty

# Or use npx (no installation required)
npx v4n1ty dead
```

### Install from source

```bash
git clone <repository-url>
cd v4n1ty
bun install
bun run build
```

### Global installation from source

```bash
bun install -g .
```

## 🎯 Usage

### Basic Usage

Generate an address starting with "dead":

```bash
v4n1ty dead
```

### Search Modes

- **start** (default): Pattern at the beginning
- **end**: Pattern at the end
- **anywhere**: Pattern anywhere in the address
- **position**: Pattern at a specific position

```bash
# Address starting with "cafe"
v4n1ty cafe --mode start

# Address ending with "beef"
v4n1ty beef --mode end

# Address containing "1337" anywhere
v4n1ty 1337 --mode anywhere

# Address with "dead" at position 5
v4n1ty dead --mode position --position 5
```

### Options

```bash
Options:
  -m, --mode <mode>        Search mode: anywhere, start, end, position (default: "start")
  -p, --position <number>  Position for position mode (0-indexed)
  -c, --case-sensitive     Case sensitive search (default: false)
  -w, --workers <number>   Number of worker threads (default: CPU cores)
  -v, --verbose            Verbose output (default: false)
  --no-color               Disable colored output
  -h, --help               Display help for command
```

### Examples

```bash
# Case-sensitive search for "CaFe"
v4n1ty CaFe --case-sensitive

# Use 8 worker threads
v4n1ty dead --workers 8

# Find "1337" at position 10
v4n1ty 1337 --mode position --position 10

# Estimate difficulty before starting
v4n1ty estimate deadbeef --mode start
```

## 🔍 Difficulty Estimation

Use the `estimate` command to check how difficult your target is:

```bash
v4n1ty estimate <target> [options]
```

This will show:
- Probability of finding the pattern
- Estimated time to find
- Recommendations for difficult targets

## ⚡ Performance

Performance depends on:
- **Target length**: Longer targets are exponentially harder
- **Search mode**: "anywhere" is generally faster than "start" or "end"
- **Case sensitivity**: Case-insensitive is typically faster
- **CPU cores**: More threads = better performance

Typical performance: 50,000+ addresses/second on modern hardware.

## 🔐 Security

- Uses cryptographically secure random number generation
- Private keys are generated using the `viem` library
- **Important**: Keep your private keys secure and never share them
- This tool is for educational/vanity purposes only

## 🛠️ Development

### Scripts

```bash
# Run in development mode
bun run dev <args>

# Build for production
bun run build

# Run built version
bun run start <args>
```

### Project Structure

```
src/
├── index.ts      # Main entry point
├── cli.ts        # CLI interface and argument parsing
├── generator.ts  # Main generator class
├── worker.ts     # Worker thread logic
├── utils.ts      # Utility functions
└── types.ts      # TypeScript type definitions
```

## 📊 Examples

### Easy targets (< 1 minute)

```bash
v4n1ty a        # ~1 in 16
v4n1ty ab       # ~1 in 256
v4n1ty abc      # ~1 in 4,096
```

### Medium targets (1-10 minutes)

```bash
v4n1ty dead     # ~1 in 65,536
v4n1ty cafe     # ~1 in 65,536
v4n1ty 1337     # ~1 in 65,536
```

### Hard targets (10+ minutes)

```bash
v4n1ty deadbeef # ~1 in 4,294,967,296
v4n1ty cafebabe # ~1 in 4,294,967,296
```

## ⚠️ Important Notes

1. **Vanity addresses are for fun/branding only** - they don't provide additional security
2. **Never reuse private keys** - generate fresh keys for each use
3. **Backup your keys** - loss of private key = loss of funds
4. **Test first** - try with small amounts before using for significant funds
5. **Consider hardware wallets** - for storing large amounts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Viem](https://viem.sh/) for Ethereum utilities
- Uses [Bun](https://bun.sh/) for fast JavaScript runtime
- CLI powered by [Commander.js](https://github.com/tj/commander.js)
- Styling with [Chalk](https://github.com/chalk/chalk)
- Progress indicators with [Ora](https://github.com/sindresorhus/ora)
