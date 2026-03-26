import { Head, Link, router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import type { PaginatedData } from '@/components/data-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/format';
import { index, show } from '@/routes/stock';

type StockRow = {
    id: number;
    product_name: string;
    category_name: string;
    size: string;
    sku: string | null;
    current_stock: number;
    is_low_stock: boolean;
};

type Props = {
    variants: PaginatedData<StockRow>;
    filters: {
        search: string;
        category_id: string;
        size: string;
        low_stock_only: boolean;
    };
    categories: Array<{
        id: string;
        name: string;
    }>;
    lowStockThreshold: number;
};

const columnHelper = createColumnHelper<StockRow>();

const columns = [
    columnHelper.accessor('product_name', {
        header: 'Variant',
        cell: ({ row, getValue }) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium">{getValue()}</span>
                <span className="text-sm text-muted-foreground">
                    {row.original.category_name} / {row.original.size}
                    {row.original.sku ? ` / ${row.original.sku}` : ''}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('size', {
        header: 'Size',
        cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge>,
    }),
    columnHelper.accessor('current_stock', {
        header: 'Current stock',
        cell: ({ getValue, row }) => (
            <div className="flex items-center gap-2">
                <span className="font-medium">{formatNumber(getValue())}</span>
                {row.original.is_low_stock ? (
                    <Badge variant="outline">Low stock</Badge>
                ) : null}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <Button variant="outline" size="sm" asChild>
                <Link href={show(row.original.id)} prefetch>
                    View batches
                </Link>
            </Button>
        ),
    }),
] as never[];

export default function StockIndex({
    variants,
    filters,
    categories,
    lowStockThreshold,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [categoryId, setCategoryId] = useState(
        filters.category_id === '' ? 'all' : filters.category_id,
    );
    const [size, setSize] = useState(
        filters.size === '' ? 'all' : filters.size,
    );
    const [lowStockOnly, setLowStockOnly] = useState(filters.low_stock_only);

    return (
        <>
            <Head title="Stock" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Stock overview"
                    description="See current sellable stock by variant, based directly on remaining FIFO batch quantities."
                />

                <Card>
                    <CardContent className="pt-6">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(
                                    index.url({
                                        query: {
                                            search: search || undefined,
                                            category_id:
                                                categoryId === 'all'
                                                    ? undefined
                                                    : categoryId,
                                            size:
                                                size === 'all'
                                                    ? undefined
                                                    : size,
                                            low_stock_only:
                                                lowStockOnly || undefined,
                                        },
                                    }),
                                    {},
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                        replace: true,
                                    },
                                );
                            }}
                            className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="search">Search stock</Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by product or category"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category-filter">
                                    Category
                                </Label>
                                <Select
                                    value={categoryId}
                                    onValueChange={setCategoryId}
                                >
                                    <SelectTrigger
                                        id="category-filter"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                All categories
                                            </SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="size-filter">Size</Label>
                                <Select value={size} onValueChange={setSize}>
                                    <SelectTrigger
                                        id="size-filter"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="All sizes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                All sizes
                                            </SelectItem>
                                            <SelectItem value="M">M</SelectItem>
                                            <SelectItem value="L">L</SelectItem>
                                            <SelectItem value="XL">
                                                XL
                                            </SelectItem>
                                            <SelectItem value="2XL">
                                                2XL
                                            </SelectItem>
                                            <SelectItem value="3XL">
                                                3XL
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button type="submit">Apply</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        setCategoryId('all');
                                        setSize('all');
                                        setLowStockOnly(false);
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

                            <label className="flex items-start gap-3 rounded-lg border p-4 lg:col-span-4">
                                <Checkbox
                                    checked={lowStockOnly}
                                    onCheckedChange={(checked) =>
                                        setLowStockOnly(checked === true)
                                    }
                                />
                                <span className="flex flex-col gap-1">
                                    <span className="font-medium">
                                        Low stock only
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Highlight and filter variants with{' '}
                                        {formatNumber(lowStockThreshold)} or
                                        fewer units remaining.
                                    </span>
                                </span>
                            </label>
                        </form>
                    </CardContent>
                </Card>

                <DataTable
                    columns={columns}
                    data={variants}
                    emptyMessage="No stock rows found."
                />
            </div>
        </>
    );
}

StockIndex.layout = {
    breadcrumbs: [
        {
            title: 'Stock',
            href: index(),
        },
    ],
};
