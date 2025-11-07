# FileDump 📤

FileDump is a stupid simple, lightweight, self-hosted file storage server. Drop files in, get them out. That's it.

I created this service to support my n8n workflows that work with binaries. I was looking for a way to quickly store my email attachments without duplication.

## Why FileDump?

- **Zero Configuration** - Works out of the box, no complex setup
- **Self-Hosted** - Your files, your server, your rules
- **Lightweight** - Single binary, SQLite database, minimal dependencies
- **Fast** - Built with Bun for blazing performance
- **Content-Addressed** - Automatic deduplication using SHA256 hashing
- **Clean UI** - Simple web interface for browsing and managing files

## Features

- ✨ **Simple Upload/Download** - Through API or UI
- ♻️ **Auto-Deduplication** - Identical files stored only once
- 🎯 **Content-Addressed Storage** - Files stored by hash, preventing collisions
- 🔧 **Configurable** - Adjust port, storage location, max file size

## Quick Start

### One-Line Install (Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/jordykoppen/file-dump/main/install.sh | sudo bash
```

This will:

- Download the correct binary for your architecture
- Install FileDump as a systemd service
- Start the server on port 3000
- Enable auto-start on boot

### Manual Installation

**Download the latest release:**

```bash
# Linux x64
wget https://github.com/jordykoppen/file-dump/releases/latest/download/filedump-linux-x64
chmod +x filedump-linux-x64
./filedump-linux-x64

# Linux ARM64
wget https://github.com/jordykoppen/file-dump/releases/latest/download/filedump-linux-arm64
chmod +x filedump-linux-arm64
./filedump-linux-arm64

# macOS (Apple Silicon)
curl -LO https://github.com/jordykoppen/file-dump/releases/latest/download/filedump-darwin-arm64
xattr -d com.apple.quarantine filedump-darwin-arm64  # Remove quarantine
chmod +x filedump-darwin-arm64
./filedump-darwin-arm64

# macOS (Intel)
curl -LO https://github.com/jordykoppen/file-dump/releases/latest/download/filedump-darwin-x64
xattr -d com.apple.quarantine filedump-darwin-x64
chmod +x filedump-darwin-x64
./filedump-darwin-x64
```

**Or build from source:**

```bash
git clone https://github.com/jordykoppen/file-dump.git
cd file-dump
bun install
bun build src/index.tsx --compile --outfile filedump
./filedump
```

## Usage

```bash
# Start with defaults (port 3000, ./files directory, ./database.sqlite)
./filedump

# Custom configuration
./filedump --port 8080 --fileDirectory /var/files --maxFileSize 2GB

# View all options
./filedump --help
```

**CLI Options:**

```
-p, --port <port>           Server port (default: 3000)
-d, --fileDirectory <path>  Directory to store files (default: ./files)
--db <path>                 SQLite database path (default: ./database.sqlite)
-m, --maxFileSize <size>    Maximum file size (default: 1GB)
                            Supports: KB, MB, GB (e.g., 500MB, 2GB)
-h, --help                  Show help message
```

## Architecture

FileDump uses a simple but effective architecture:

- **Storage**: Files stored by SHA256 hash (content-addressed)
- **Database**: SQLite for metadata (names, types, upload dates)
- **Deduplication**: Automatic - identical files share storage
- **Frontend**: React SPA served by Bun
- **Backend**: Bun server with efficient file handling

## Security

⚠️ **Important**: FileDump has **no built-in authentication**. It's designed to run:

- Behind a VPN
- Behind an authenticated reverse proxy (nginx, Caddy, Traefik)
- On a trusted local network

**Do not expose FileDump directly to the internet without authentication.**

## Deployment Examples

### Systemd Service

The one-line installer creates this automatically, but here's the manual setup:

```bash
# Create service file
sudo tee /etc/systemd/system/filedump.service > /dev/null <<EOF
[Unit]
Description=FileDump File Server
After=network.target

[Service]
Type=simple
User=filedump
WorkingDirectory=/opt/filedump
ExecStart=/usr/local/bin/filedump --port 3000 --fileDirectory /var/filedump/files --db /var/filedump/database.sqlite
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create user and directories
sudo useradd -r -s /bin/false filedump
sudo mkdir -p /var/filedump/files
sudo chown -R filedump:filedump /var/filedump

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable filedump
sudo systemctl start filedump
```

### Docker

```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY . .
RUN bun install
RUN bun build src/index.tsx --compile --outfile filedump

EXPOSE 3000
VOLUME ["/data"]

CMD ["./filedump", "--fileDirectory", "/data/files", "--db", "/data/database.sqlite"]
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name files.example.com;

    # Add authentication
    auth_basic "FileDump";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Increase upload size limit
        client_max_body_size 2G;
    }
}
```

## Development

```bash
# Clone repository
git clone https://github.com/jordykoppen/file-dump.git
cd file-dump

# Install dependencies
bun install

# Run development server (with hot reload)
bun run dev

# Build for production
bun run build

# Compile to executable
bun build src/index.tsx --compile --outfile filedump
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Frontend**: React 19 + TanStack Query + Tailwind CSS
- **Database**: SQLite (via bun:sqlite)
- **Language**: TypeScript

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

Elastic 2.0 © [Jordy Koppen](https://github.com/jordykoppen)

## Acknowledgments

Built with [Bun](https://bun.sh) - the fast all-in-one JavaScript runtime.

---

**Need help?** [Open an issue](https://github.com/jordykoppen/file-dump/issues)
**Love FileDump?** [Star the repo](https://github.com/jordykoppen/file-dump) ⭐
