/**
 * Filter utilities for mock data based on Supabase query syntax
 */

/**
 * Parse Supabase filter operators from query string
 * Supports: eq, neq, gt, gte, lt, lte, like, ilike, in, is
 */
export function parseFilterParam(
  param: string
): { field: string; operator: string; value: string } | null {
  // Handle operators: eq, neq, gt, gte, lt, lte, like, ilike, in, is
  const operators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in', 'is'];
  
  for (const op of operators) {
    if (param.endsWith(`.${op}`)) {
      const field = param.slice(0, -(op.length + 1));
      return { field, operator: op, value: '' };
    }
  }
  
  return null;
}

/**
 * Apply filter to an item based on field, operator, and value
 */
export function applyFilter<T extends Record<string, unknown>>(
  item: T,
  field: string,
  operator: string,
  value: string | string[]
): boolean {
  const itemValue = getNestedValue(item, field);
  
  switch (operator) {
    case 'eq':
      return String(itemValue) === String(value);
    case 'neq':
      return String(itemValue) !== String(value);
    case 'gt':
      return Number(itemValue) > Number(value);
    case 'gte':
      return Number(itemValue) >= Number(value);
    case 'lt':
      return Number(itemValue) < Number(value);
    case 'lte':
      return Number(itemValue) <= Number(value);
    case 'like':
      return String(itemValue).includes(String(value));
    case 'ilike':
      return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
    case 'in':
      const values = Array.isArray(value) ? value : [value];
      return values.includes(String(itemValue));
    case 'is':
      if (value === 'null') return itemValue === null || itemValue === undefined;
      if (value === 'not.null') return itemValue !== null && itemValue !== undefined;
      return String(itemValue) === String(value);
    default:
      return true;
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

/**
 * Filter array based on URL search params (Supabase style)
 */
export function filterArray<T extends Record<string, unknown>>(
  items: T[],
  searchParams: URLSearchParams
): T[] {
  let filtered = [...items];

  // Handle each filter parameter
  searchParams.forEach((value, key) => {
    const filter = parseFilterParam(key);
    if (filter) {
      filtered = filtered.filter((item) => applyFilter(item, filter.field, filter.operator, value));
    } else if (key === 'select') {
      // Handle select - we'll handle this separately
      return;
    } else {
      // Simple equality check for non-operator fields
      filtered = filtered.filter((item) => {
        const itemValue = getNestedValue(item, key);
        return String(itemValue) === value;
      });
    }
  });

  return filtered;
}

/**
 * Sort array based on order parameter (Supabase style: field.asc or field.desc)
 */
export function sortArray<T extends Record<string, unknown>>(
  items: T[],
  orderParam: string | null
): T[] {
  if (!orderParam) return items;

  const sorted = [...items];
  const orders = orderParam.split(',');

  return sorted.sort((a, b) => {
    for (const order of orders) {
      const [field, direction] = order.split('.');
      const aValue = getNestedValue(a, field);
      const bValue = getNestedValue(b, field);

      if (aValue === bValue) continue;

      const comparison = (aValue as number | string) < (bValue as number | string) ? -1 : (aValue as number | string) > (bValue as number | string) ? 1 : 0;
      return direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });
}

