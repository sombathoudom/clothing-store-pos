import { Link } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export type PaginatedData<TData> = {
    data: TData[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props<TData> = {
    columns: ColumnDef<TData>[];
    data: PaginatedData<TData>;
    emptyMessage: string;
};

export function DataTable<TData>({
    columns,
    data,
    emptyMessage,
}: Props<TData>) {
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: data.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-xl border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
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
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                    {data.total === 0
                        ? 'No results found.'
                        : `Showing ${data.from} to ${data.to} of ${data.total} results`}
                </p>

                <Pagination className="mx-0 w-auto justify-start md:justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            {data.prev_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={data.prev_page_url} prefetch>
                                        Previous
                                    </Link>
                                </Button>
                            ) : (
                                <PaginationPrevious
                                    href="#"
                                    className="pointer-events-none opacity-50"
                                />
                            )}
                        </PaginationItem>
                        <PaginationItem>
                            <span className="px-3 text-sm text-muted-foreground">
                                Page {data.current_page} of {data.last_page}
                            </span>
                        </PaginationItem>
                        <PaginationItem>
                            {data.next_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={data.next_page_url} prefetch>
                                        Next
                                    </Link>
                                </Button>
                            ) : (
                                <PaginationNext
                                    href="#"
                                    className="pointer-events-none opacity-50"
                                />
                            )}
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}
