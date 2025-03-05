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

  // First, identify potential arrays by analyzing patterns of keys
  const potentialArrays = new Map<string, Set<number>>();
  const definiteObjects = new Set<string>();

  for (const key of Object.keys(obj)) {
    const parts = key.split(".");
    let currentPath = "";

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];

      currentPath = currentPath ? `${currentPath}.${part}` : part;

      // Check if the next part is a potential array index
      if (
        !isNaN(Number(nextPart)) &&
        String(parseInt(nextPart, 10)) === nextPart
      ) {
        // It's a potential array index
        if (!potentialArrays.has(currentPath)) {
          potentialArrays.set(currentPath, new Set<number>());
        }
        potentialArrays.get(currentPath)?.add(parseInt(nextPart, 10));
      } else {
        // If we find a non-numeric key, it cannot be an array
        definiteObjects.add(currentPath);
      }
    }
  }

  // Determine which paths should be arrays
  const shouldBeArray = new Set<string>();

  potentialArrays.forEach((indices, path) => {
    // If this path is already known to be an object, skip it
    if (definiteObjects.has(path)) return;

    // Check if indices form a sequential array starting from 0
    const sortedIndices = Array.from(indices).sort((a, b) => a - b);

    // Only consider it an array if indices start at 0 and are sequential
    if (
      sortedIndices[0] === 0 &&
      sortedIndices.every((value, index) => value === index)
    ) {
      shouldBeArray.add(path);
    }
  });

  // Now actually build the result object
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(".");
    let current = result;
    let currentPath = "";

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}.${part}` : part;

      if (!current[part]) {
        // Initialize based on whether this should be an array
        current[part] = shouldBeArray.has(currentPath) ? [] : {};
      }

      current = current[part];
    }

    // For the last part, set the value
    const lastPart = parts[parts.length - 1];

    // Try to convert value to number if possible
    const parsedValue =
      !isNaN(Number(value)) && value !== "" && String(Number(value)) === value
        ? Number(value)
        : value;

    current[lastPart] = parsedValue;
  }

  return result;
}
