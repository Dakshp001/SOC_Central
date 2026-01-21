// src/components/dashboards/Meraki/DetailTable.tsx
import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Network } from "lucide-react";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";
import { EnhancedMerakiData } from "@/lib/api";

interface DetailTableProps {
  detailKey: string;
  title: string;
  data: EnhancedMerakiData;
}

export const DetailTable: React.FC<DetailTableProps> = ({
  detailKey,
  title,
  data,
}) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { actualTheme } = useTheme();

  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const inputBg = "bg-background border-border";

  const detailData = data.details[detailKey as keyof typeof data.details] as any[];

  if (!Array.isArray(detailData) || detailData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Network className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">
          No data available for {detailKey}
        </p>
        <p className="text-muted-foreground text-sm">Available data sections:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(data.details).map((key) => (
            <Badge
              key={key}
              variant="outline"
              className="text-xs border-border text-muted-foreground"
            >
              {key} (
              {(data.details[key as keyof typeof data.details] as any[])?.length || 0}
              )
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  const columns = Object.keys(detailData[0] || {});

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = detailData;

    if (searchFilter) {
      filtered = filtered.filter((row: any) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchFilter.toLowerCase())
        )
      );
    }

    if (sortColumn) {
      filtered = [...filtered].sort((a: any, b: any) => {
        const aVal = a[sortColumn] || "";
        const bVal = b[sortColumn] || "";

        const comparison = aVal
          .toString()
          .localeCompare(bVal.toString(), undefined, { numeric: true });
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [detailData, searchFilter, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedData(filteredData, 10);

  return (
    <div className="space-y-4 w-full">
      {/* Header with filters */}
      <div className={`flex items-center justify-between p-3 ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} rounded-lg border border-border`}>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-400" />
          <h3 className={`text-lg font-semibold ${textPrimary}`}>{title}</h3>
          <Badge variant="outline" className="text-muted-foreground border-border">
            {filteredData.length} records
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className={`text-xs ${textSecondary}`}>Sort:</label>
            <select
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              className={`${inputBg} ${textPrimary} border rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none`}
            >
              <option value="">Default</option>
              {columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className={`text-xs ${textSecondary}`}>Search:</label>
            <input
              type="text"
              placeholder="Search..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className={`w-40 ${inputBg} ${textPrimary} border rounded px-3 py-1.5 text-sm placeholder-muted-foreground focus:border-blue-500 focus:outline-none`}
            />
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} rounded-lg border border-border p-3`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={!hasPrevPage}
            className="border-border text-muted-foreground hover:bg-muted/50"
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className={`${textSecondary} text-sm`}>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={!hasNextPage}
            className="border-border text-muted-foreground hover:bg-muted/50"
          >
            Next
          </Button>
        </div>
      )}

      {/* Enhanced Table */}
      <div className="w-full border border-border rounded-lg bg-card">
        <div className="w-full overflow-x-auto">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table className="w-full relative">
              <TableHeader className={`sticky top-0 ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} z-10`}>
                <TableRow className="border-border">
                  {columns.map((column) => (
                    <TableHead
                      key={column}
                      className={`${textSecondary} font-medium hover:bg-muted/50 whitespace-nowrap px-4 py-3 text-left cursor-pointer transition-colors`}
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {sortColumn === column && (
                          <span className="text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className="border-border hover:bg-muted/50 transition-colors"
                  >
                    {columns.map((column) => {
                      const cellValue = row[column] || "-";
                      let cellClass = `${textPrimary} px-4 py-3`;

                      // Style specific column types
                      if (column.toLowerCase().includes("usage") && cellValue !== "-") {
                        cellClass = "text-green-400 font-medium px-4 py-3";
                      } else if (column.toLowerCase().includes("clients") && cellValue !== "-") {
                        cellClass = "text-cyan-400 font-medium px-4 py-3";
                      } else if (column.toLowerCase().includes("name") && cellValue !== "-") {
                        cellClass = "text-blue-400 font-medium px-4 py-3";
                      }

                      return (
                        <TableCell key={column} className={cellClass}>
                          <div
                            className="min-w-[140px] max-w-[300px] break-words"
                            title={cellValue.toString()}
                          >
                            {cellValue.toString().length > 50 ? (
                              <span className="block">
                                {cellValue.toString().substring(0, 50)}
                                <span className="text-muted-foreground">...</span>
                              </span>
                            ) : (
                              cellValue
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};