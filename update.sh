#!/bin/bash
set -e

# FileDump Updater
# Updates an existing FileDump installation to the latest release

echo "===================="
echo "FileDump Updater"
echo "===================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Check if FileDump is installed
if [ ! -f /opt/filedump/filedump ]; then
    echo "Error: FileDump is not installed at /opt/filedump/filedump"
    echo "Please run install.sh first"
    exit 1
fi

# Check if service exists
if ! systemctl list-unit-files | grep -q filedump.service; then
    echo "Error: FileDump service is not installed"
    echo "Please run install.sh first"
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

# Get current version (if possible)
if systemctl is-active --quiet filedump; then
    echo "Current status: Running"
else
    echo "Current status: Stopped"
fi
echo ""

# Backup current binary
echo "Backing up current binary..."
cp /opt/filedump/filedump /opt/filedump/filedump.backup
echo "✓ Backup created at /opt/filedump/filedump.backup"

# Download latest binary
echo "Downloading latest FileDump release..."
DOWNLOAD_URL="https://github.com/jordykoppen/filedump/releases/latest/download/$BINARY"
curl -fsSL "$DOWNLOAD_URL" -o /tmp/filedump

if [ $? -ne 0 ]; then
    echo "Error: Failed to download FileDump"
    echo "Restoring backup..."
    rm -f /tmp/filedump
    exit 1
fi

echo "✓ Downloaded latest release"

# Stop service
echo "Stopping FileDump service..."
systemctl stop filedump
echo "✓ Service stopped"

# Install new binary
echo "Installing new binary..."
chmod +x /tmp/filedump
mv /tmp/filedump /opt/filedump/filedump
chown filedump:filedump /opt/filedump/filedump
echo "✓ Binary updated"

# Start service
echo "Starting FileDump service..."
systemctl start filedump
sleep 2

# Check status
if systemctl is-active --quiet filedump; then
    echo "✓ FileDump is running"
    echo ""
    echo "===================="
    echo "Update Complete!"
    echo "===================="
    echo ""
    echo "FileDump has been updated to the latest version"
    echo ""
    echo "You can remove the backup with:"
    echo "  sudo rm /opt/filedump/filedump.backup"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:      sudo journalctl -u filedump -f"
    echo "  - Check status:   sudo systemctl status filedump"
    echo "  - Restart:        sudo systemctl restart filedump"
    echo ""
else
    echo "✗ FileDump failed to start"
    echo ""
    echo "Restoring backup..."
    systemctl stop filedump
    cp /opt/filedump/filedump.backup /opt/filedump/filedump
    chown filedump:filedump /opt/filedump/filedump
    systemctl start filedump

    if systemctl is-active --quiet filedump; then
        echo "✓ Backup restored and service is running"
        echo ""
        echo "The update failed, but your previous version has been restored."
        echo "Check logs with: sudo journalctl -u filedump -n 50"
    else
        echo "✗ Failed to restore service"
        echo "Manual intervention required"
        echo "Check logs with: sudo journalctl -u filedump -n 50"
    fi
    exit 1
fi
