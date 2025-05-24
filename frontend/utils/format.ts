export interface TruncateAddressOptions {
  startChars?: number;
  endChars?: number;
}

export const truncateAddress = (
  address: string | number | undefined | null,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return "";

  // Ensure the address is a string and normalize it
  const normalized: string = String(address).toLowerCase();

  // Check if the address is too short to truncate
  if (normalized.length <= startChars + endChars) {
    return normalized;
  }

  // Handle both addresses with and without '0x' prefix
  const prefix: string = normalized.startsWith("0x") ? "0x" : "";
  const addressWithoutPrefix: string = normalized.startsWith("0x")
    ? normalized.slice(2)
    : normalized;

  const start: string = addressWithoutPrefix.slice(
    0,
    startChars - (prefix === "0x" ? 2 : 0)
  );
  const end: string = addressWithoutPrefix.slice(-endChars);

  return `${prefix}${start}...${end}`;
};
