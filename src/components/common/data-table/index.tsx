"use client";

import {
  ColumnDef,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// TanStack Table v9: fitur dan row model harus didaftarkan secara eksplisit.
// Dideklarasikan di luar komponen supaya referensinya stabil.
const features = tableFeatures({
  rowSelectionFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(), // pengganti getPaginationRowModel()
});

// Dipakai di file definisi kolom: ColumnDef<DataTableFeatures, NamaTipeData>[]
// (gunakan `import type` agar aman diimpor dari server component)
export type DataTableFeatures = typeof features;

interface DataTableProps<TData extends { id: string }> {
  // TValue memakai `any` karena kolom dengan tipe nilai berbeda-beda
  // (string, number, dst.) tidak bisa disatukan menjadi `unknown` di v9.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<DataTableFeatures, TData, any>[];
  data: TData[];
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onBulkDelete?: (selectedIds: string[]) => void;
  isDeleting?: boolean;
}

export function DataTable<TData extends { id: string }>({
  columns,
  data,
  rowSelection,
  setRowSelection,
  onBulkDelete,
  isDeleting,
}: DataTableProps<TData>) {
  // v9: useReactTable -> useTable, getCoreRowModel tidak perlu lagi (otomatis)
  const table = useTable({
    features,
    columns,
    data,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
  });

  const selectedIds = Object.keys(rowSelection);

  return (
    <div className="space-y-4">
      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && onBulkDelete && (
        <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-200">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} row(s) selected.
          </span>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => onBulkDelete(selectedIds)}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      )}

      {/* Table Structure */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-slate-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* getVisibleCells() butuh columnVisibilityFeature di v9,
                      getAllCells() adalah bagian dari core */}
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-slate-500"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
