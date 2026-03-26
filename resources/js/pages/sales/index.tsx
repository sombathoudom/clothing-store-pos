import { Head, Link, router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import type { PaginatedData } from '@/components/data-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { index, show } from '@/routes/sales';

type SaleRow = {
    id: number;
    invoice_no: string;
    customer_name: string | null;
    status: string;
    total_amount: string;
    discount: string;
    final_amount: string;
    sold_at: string | null;
};

type Props = {
    sales: PaginatedData<SaleRow>;
    filters: {
        search: string;
    };
};

const columnHelper = createColumnHelper<SaleRow>();

const columns = [
    columnHelper.accessor('invoice_no', {
        header: 'Invoice',
        cell: ({ row, getValue }) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium">{getValue()}</span>
                <span className="text-sm text-muted-foreground">
                    {row.original.customer_name ?? 'Walk-in customer'}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
    }),
    columnHelper.accessor('final_amount', {
        header: 'Final amount',
        cell: ({ getValue }) => formatCurrency(getValue()),
    }),
    columnHelper.accessor('sold_at', {
        header: 'Sold at',
        cell: ({ getValue }) => formatDateTime(getValue()),
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <Button variant="outline" size="sm" asChild>
                <Link href={show(row.original.id)} prefetch>
                    View
                </Link>
            </Button>
        ),
    }),
] as never[];

export default function SalesIndex({ sales, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    return (
        <>
            <Head title="Sales" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Sales history"
                    description="Review completed sales, invoice totals, and drill into the exact FIFO cost allocations behind each order."
                />

                <Card>
                    <CardContent className="pt-6">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(
                                    index.url({
                                        query: { search: search || undefined },
                                    }),
                                    {},
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                        replace: true,
                                    },
                                );
                            }}
                            className="grid gap-4 md:grid-cols-[1fr_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="search">Search sales</Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by invoice or customer"
                                />
                            </div>

                            <div className="flex items-end gap-2">
                                <Button type="submit">Apply</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(
                                            index(),
                                            {},
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <DataTable
                    columns={columns}
                    data={sales}
                    emptyMessage="No sales found."
                />
            </div>
        </>
    );
}

SalesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Sales',
            href: index(),
        },
    ],
};
