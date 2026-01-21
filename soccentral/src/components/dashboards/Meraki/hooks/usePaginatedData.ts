// 4. hooks/usePaginatedData.ts
import { useState, useMemo } from "react";

export const usePaginatedData = (data: any[], pageSize: number = 50) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  return {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};