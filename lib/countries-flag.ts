// Convert ISO code to emoji flag
export function getFlagEmoji(countryCode: string) {
  // return String.fromCodePoint(
  //   ...countryCode
  //     .toUpperCase()
  //     .split('')
  //     .map((char) => 127397 + char.charCodeAt()),
  // );
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}
