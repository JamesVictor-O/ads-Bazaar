export const truncateAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return "";

  // Ensure the address is a string and normalize it
  const normalized = String(address).toLowerCase();

  // Check if the address is too short to truncate
  if (normalized.length <= startChars + endChars) {
    return normalized;
  }

  // Handle both addresses with and without '0x' prefix
  const prefix = normalized.startsWith("0x") ? "0x" : "";
  const addressWithoutPrefix = normalized.startsWith("0x")
    ? normalized.slice(2)
    : normalized;

  const start = addressWithoutPrefix.slice(
    0,
    startChars - (prefix === "0x" ? 2 : 0)
  );
  const end = addressWithoutPrefix.slice(-endChars);

  return `${prefix}${start}...${end}`;
};
