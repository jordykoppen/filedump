export const hashFile = async (arrayBuffer: ArrayBuffer) => {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(arrayBuffer);
  return hasher.digest("hex");
};
