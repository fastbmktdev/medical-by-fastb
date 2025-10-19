/**
 * Determines if a value is "empty".
 * Empty means: null, undefined, empty string, empty array, or empty object.
 * @param value - The value to check.
 * @returns True if empty, false otherwise.
 */
function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  )
    return true;
  return false;
}

/**
 * Returns the value if not empty, otherwise returns the default.
 * @param value - The value to check.
 * @param defaultValue - The default value to return if value is empty.
 * @returns The value or the default.
 */
export function getValueOrDefault<T>(value: T, defaultValue: T): T {
  return isEmpty(value) ? defaultValue : value;
}
