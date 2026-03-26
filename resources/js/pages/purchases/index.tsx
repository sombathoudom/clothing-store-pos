import { Head, Link, router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import type { PaginatedData } from '@/components/data-table';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTime, formatNumber } from '@/lib/format';
import { create, index, show } from '@/routes/purchases';

type PurchaseRow = {
    id: number;
    reference_no: string | null;
    supplier_name: string | null;
    purchased_at: string | null;
    items_count: number;
    total_qty: number;
    created_at: string | null;
};

type Props = {
    purchases: PaginatedData<PurchaseRow>;
    filters: {
        search: string;
    };
};

const columnHelper = createColumnHelper<PurchaseRow>();

const columns = [
    columnHelper.accessor('reference_no', {
        header: 'Reference',
        cell: ({ row, getValue }) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium">
                    {getValue() ?? `Purchase #${row.original.id}`}
                </span>
                <span className="text-sm text-muted-foreground">
                    {row.original.supplier_name ?? 'No supplier'}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('purchased_at', {
        header: 'Purchased at',
        cell: ({ getValue }) => formatDateTime(getValue()),
    }),
    columnHelper.accessor('items_count', {
        header: 'Lines',
        cell: ({ getValue }) => formatNumber(getValue()),
    }),
    columnHelper.accessor('total_qty', {
        header: 'Total qty',
        cell: ({ getValue }) => formatNumber(getValue()),
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

export default function PurchasesIndex({ purchases, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    return (
        <>
            <Head title="Purchases" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Purchases"
                    description="Record incoming inventory batches with their exact cost and suggested sell price."
                    action={
                        <Button asChild>
                            <Link href={create()} prefetch>
                                Add purchase
                            </Link>
                        </Button>
                    }
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
                                <Label htmlFor="search">Search purchases</Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by reference or supplier"
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
                    data={purchases}
                    emptyMessage="No purchases found."
                />
            </div>
        </>
    );
}

PurchasesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Purchases',
            href: index(),
        },
    ],
};
