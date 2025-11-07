/**
 * Parse file size string (e.g., "1GB", "500MB", "100KB") to bytes
 */
export function parseFileSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)(KB|MB|GB)$/i);
  if (!match) {
    throw new Error(
      `Invalid file size format: "${sizeStr}". Use format like "1GB", "500MB", or "100KB"`
    );
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return Math.floor(value * multipliers[unit]);
}
