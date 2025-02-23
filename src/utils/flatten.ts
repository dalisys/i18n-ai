export function flattenObject(
  obj: Record<string, any>,
  prefix = ""
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          flattened[`${newKey}.${index}`] = String(item);
        });
      } else {
        Object.assign(flattened, flattenObject(value, newKey));
      }
    } else {
      flattened[newKey] = String(value);
    }
  }

  return flattened;
}

export function unflattenObject(
  obj: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(".");
    let current = result;
    const lastIndex = parts.length - 1;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const nextPart = i < lastIndex ? parts[i + 1] : null;

      if (i === lastIndex) {
        // Try to parse as number first for array indices
        const numValue =
          !isNaN(Number(value)) && String(Number(value)) === value
            ? Number(value)
            : value;
        current[part] = numValue;
      } else {
        // If next part is a number, initialize as array
        if (nextPart && !isNaN(Number(nextPart))) {
          current[part] = current[part] || [];
        } else {
          current[part] = current[part] || {};
        }
        current = current[part];
      }
    }
  }

  return result;
}
