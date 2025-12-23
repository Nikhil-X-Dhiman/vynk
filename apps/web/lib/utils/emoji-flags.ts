// Convert ISO code to emoji flag
export function emojiFlag(countryCode: string) {
  return countryCode
  .toUpperCase()
  .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}
