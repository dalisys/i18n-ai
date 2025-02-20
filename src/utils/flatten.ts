export function flattenObject(
  obj: Record<string, any>,
  prefix = ""
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = JSON.stringify(value);
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

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        try {
          current[part] = JSON.parse(value);
        } catch {
          current[part] = value;
        }
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }

  return result;
}
