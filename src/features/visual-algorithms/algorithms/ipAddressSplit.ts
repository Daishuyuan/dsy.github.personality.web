export function splitIpAddress(digits: string): string[] {
  if (!/^\d{4,12}$/.test(digits)) {
    return [];
  }

  const results: string[] = [];

  function isValid(part: string) {
    if (part.length > 1 && part.startsWith("0")) {
      return false;
    }
    const value = Number(part);
    return value >= 0 && value <= 255;
  }

  for (let a = 1; a <= 3; a += 1) {
    for (let b = 1; b <= 3; b += 1) {
      for (let c = 1; c <= 3; c += 1) {
        const d = digits.length - a - b - c;
        if (d < 1 || d > 3) {
          continue;
        }
        const parts = [
          digits.slice(0, a),
          digits.slice(a, a + b),
          digits.slice(a + b, a + b + c),
          digits.slice(a + b + c)
        ];
        if (parts.every(isValid)) {
          results.push(parts.join("."));
        }
      }
    }
  }

  return results;
}
