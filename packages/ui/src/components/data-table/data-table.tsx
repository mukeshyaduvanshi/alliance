"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { EmptyState } from "../feedback/empty-state";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyTitle?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  pageSize?: number;
  totalRows?: number;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyTitle,
  emptyDescription,
  isLoading,
  pageSize = 10,
  totalRows,
  pageIndex = 0,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const isServerPaged = onPageChange !== undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerPaged ? undefined : getPaginationRowModel(),
    ...(isServerPaged
      ? {
          manualPagination: true,
          pageCount: Math.max(1, Math.ceil((totalRows ?? 0) / pageSize)),
          state: { pagination: { pageIndex, pageSize } },
        }
      : {}),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-sm">
          {isServerPaged
            ? `${pageIndex * pageSize - (pageSize - 1)}–${Math.min(
                pageIndex * pageSize,
                totalRows ?? 0
              )} of ${totalRows ?? 0}`
            : `${table.getFilteredRowModel().rows.length} row(s)`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isServerPaged) {
                onPageChange?.(Math.max(1, pageIndex));
              } else {
                table.previousPage();
              }
            }}
            disabled={
              isServerPaged
                ? pageIndex <= 1
                : !table.getCanPreviousPage()
            }
          >
            Previous
          </Button>
          {isServerPaged && (
            <span className="text-muted-foreground text-sm">
              Page {pageIndex} of {Math.max(1, Math.ceil((totalRows ?? 0) / pageSize))}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isServerPaged) {
                onPageChange?.(pageIndex + 1);
              } else {
                table.nextPage();
              }
            }}
            disabled={
              isServerPaged
                ? pageIndex * pageSize >= (totalRows ?? 0)
                : !table.getCanNextPage()
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
