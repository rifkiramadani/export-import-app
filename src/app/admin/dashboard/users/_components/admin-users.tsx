"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Profile } from "@/types/user";
import { DataTable } from "@/components/common/data-table";
import type { DataTableFeatures } from "@/components/common/data-table";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminDeleteUsers } from "../action";
import Image from "next/image";
import { AdminUserDialog } from "./admin-user-dialog";
import { AdminUserDeleteButton } from "./admin-user-delete-button";
import { fetchAdminUsers } from "../services/admin-users";
import { useDebounce } from "@/hooks/use-debounce";

interface AdminUsersPageProps {
  initialUsers: Profile[];
  initialPage: number;
  totalPages: number;
  pageSize: number;
}

export default function AdminUsersPage({
  initialUsers,
  initialPage,
  totalPages: initialTotalPages,
  pageSize,
}: AdminUsersPageProps) {
  const queryClient = useQueryClient();

  const [page, setPageState] = useState<number>(initialPage);
  const [search, setSearch] = useState<string>("");
  const [role, setRole] = useState<string>("all");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, startDeleteTransition] = useTransition();

  const debouncedSearch = useDebounce(search, 500);
  const hasFilter = debouncedSearch.trim() !== "" || role !== "all";

  const queryKeyFor = useCallback(
    (p: number) =>
      ["admin-users", pageSize, { search: debouncedSearch, role }, p] as const,
    [pageSize, debouncedSearch, role],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery({
    queryKey: queryKeyFor(page),
    queryFn: () =>
      fetchAdminUsers({
        page,
        pageSize,
        search: debouncedSearch,
        role,
      }),
    initialData:
      page === initialPage && !hasFilter
        ? { data: initialUsers, totalPages: initialTotalPages }
        : undefined,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: queryKeyFor(page + 1),
        queryFn: () =>
          fetchAdminUsers({
            page: page + 1,
            pageSize,
            search: debouncedSearch,
            role,
          }),
        staleTime: 60_000,
      });
    }
  }, [
    page,
    totalPages,
    pageSize,
    debouncedSearch,
    role,
    queryClient,
    queryKeyFor,
  ]);

  const setPage = (updater: number | ((p: number) => number)) => {
    const newPage = typeof updater === "function" ? updater(page) : updater;
    setPageState(newPage);
    setRowSelection({});
    window.history.replaceState(null, "", `?page=${newPage}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    setPage(1);
  };

  const columns: ColumnDef<DataTableFeatures, Profile>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "avatar_url",
      header: "Avatar",
      cell: ({ row }) => {
        const url = row.getValue("avatar_url") as string | null;
        return url ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100">
            <Image
              src={url}
              alt="Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
            No
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name || "Unnamed"}</span>
      ),
    },
    {
      accessorKey: "company_name",
      header: "Company",
      cell: ({ row }) => <span>{row.original.company_name || "-"}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.original.role === "admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {row.original.role}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const profile = row.original;
        return (
          <div className="flex items-center gap-1">
            <AdminUserDialog user={profile} />
            <AdminUserDeleteButton
              userId={profile.id}
              userName={profile.name ?? ""}
            />
          </div>
        );
      },
    },
  ];

  const handleBulkDelete = (ids: string[]) => {
    startDeleteTransition(async () => {
      const res = await adminDeleteUsers(ids);
      if (res.success) {
        toast.success("Selected users deleted successfully (Admin)!");
        setRowSelection({});
        if (page > 1 && ids.length >= users.length) {
          setPage(page - 1);
        }
        await queryClient.invalidateQueries({
          queryKey: ["admin-users"],
        });
      } else {
        toast.error("Failed to delete users", { description: res.message });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            User Management (Admin)
          </h1>
          <p className="text-slate-600 font-light">
            Oversee and manage system users, roles, and profiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9 h-10"
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-0 focus-visible:ring-1"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-red-700">
            Failed to load users
          </p>
          <p className="text-xs text-red-600">{error?.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <span className="text-center py-20 text-slate-500 block">
          Loading...
        </span>
      ) : (
        <div
          aria-busy={isFetching}
          className={`transition-opacity duration-200 ${
            isFetching && isPlaceholderData ? "opacity-60" : "opacity-100"
          }`}
        >
          <DataTable
            columns={columns}
            data={users}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onBulkDelete={handleBulkDelete}
            isDeleting={isDeleting}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}
