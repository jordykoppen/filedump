#!/bin/bash
set -e

# FileDump Installer
# Installs FileDump as a systemd service on Linux

echo "===================="
echo "FileDump Installer"
echo "===================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        BINARY="filedump-linux-x64"
        ;;
    aarch64|arm64)
        BINARY="filedump-linux-arm64"
        ;;
    *)
        echo "Error: Unsupported architecture: $ARCH"
        echo "Supported: x86_64, aarch64/arm64"
        exit 1
        ;;
esac

echo "Detected architecture: $ARCH"
echo "Binary: $BINARY"
echo ""

# Download binary
echo "Downloading FileDump..."
DOWNLOAD_URL="https://github.com/jordykoppen/filedump/releases/latest/download/$BINARY"
curl -fsSL "$DOWNLOAD_URL" -o /tmp/filedump

if [ $? -ne 0 ]; then
    echo "Error: Failed to download FileDump"
    exit 1
fi

echo "✓ Downloaded FileDump"

# Install binary
echo "Installing binary to /opt/filedump..."
chmod +x /tmp/filedump
mkdir -p /opt/filedump
mv /tmp/filedump /opt/filedump/filedump
echo "✓ Installed to /opt/filedump/filedump"

# Create user
if ! id -u filedump >/dev/null 2>&1; then
    echo "Creating filedump user..."
    useradd -r -s /bin/false filedump
    echo "✓ Created filedump user"
else
    echo "✓ User filedump already exists"
fi

# Create directories
echo "Creating data directories..."
mkdir -p /opt/filedump/files
chown -R filedump:filedump /opt/filedump
echo "✓ Created /opt/filedump"

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/filedump.service <<EOF
[Unit]
Description=FileDump File Server
After=network.target

[Service]
Type=simple
User=filedump
Group=filedump
WorkingDirectory=/opt/filedump
ExecStart=/opt/filedump/filedump --port 3000 --fileDirectory /opt/filedump/files --db /opt/filedump/database.sqlite
Restart=always
RestartSec=10

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/filedump

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Created systemd service"

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload
echo "✓ Reloaded systemd"

# Enable service
echo "Enabling FileDump service..."
systemctl enable filedump
echo "✓ Enabled FileDump service"

# Start service
echo "Starting FileDump service..."
systemctl start filedump
sleep 2

# Check status
if systemctl is-active --quiet filedump; then
    echo "✓ FileDump is running"
    echo ""
    echo "===================="
    echo "Installation Complete!"
    echo "===================="
    echo ""
    echo "FileDump is now running on http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:      sudo journalctl -u filedump -f"
    echo "  - Check status:   sudo systemctl status filedump"
    echo "  - Stop service:   sudo systemctl stop filedump"
    echo "  - Start service:  sudo systemctl start filedump"
    echo "  - Restart:        sudo systemctl restart filedump"
    echo ""
    echo "Data location:      /opt/filedump"
    echo "Binary location:    /opt/filedump/filedump"
    echo "Service file:       /etc/systemd/system/filedump.service"
    echo ""
else
    echo "✗ FileDump failed to start"
    echo ""
    echo "Check logs with: sudo journalctl -u filedump -n 50"
    exit 1
fi
