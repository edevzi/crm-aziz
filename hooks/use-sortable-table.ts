import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export function useSortableTable<T>(data: T[] | undefined | null) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedData = useMemo(() => {
    const safeData = data || [];
    if (!sortKey || !sortDirection) return safeData;

    return [...safeData].sort((a, b) => {
      // Helper function to resolve nested keys like "driver.name"
      const getVal = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
      };
      
      const valA = getVal(a, sortKey);
      const valB = getVal(b, sortKey);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (valB === null || valB === undefined) return sortDirection === 'asc' ? 1 : -1;

      const numA = Number(valA);
      const numB = Number(valB);

      // Handle numeric sorting robustly (avoid boolean casting to number)
      if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '' && typeof valA !== 'boolean' && typeof valB !== 'boolean') {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Handle date strings
      const dateA = Date.parse(valA as string);
      const dateB = Date.parse(valB as string);
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return { sortedData, sortKey, sortDirection, toggleSort };
}
