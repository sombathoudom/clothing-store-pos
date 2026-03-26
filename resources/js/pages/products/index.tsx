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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/lib/format';
import { create, edit, index } from '@/routes/products';

type ProductRow = {
    id: number;
    name: string;
    image_url: string | null;
    is_active: boolean;
    category: {
        id: number | null;
        name: string | null;
    };
    sizes: string[];
    created_at: string | null;
};

type Props = {
    products: PaginatedData<ProductRow>;
    filters: {
        search: string;
        category_id: string;
        status: string;
    };
    categories: Array<{
        id: string;
        name: string;
    }>;
};

const columnHelper = createColumnHelper<ProductRow>();

const columns = [
    columnHelper.accessor('name', {
        header: 'Product',
        cell: ({ row, getValue }) => (
            <div className="flex items-center gap-3">
                {row.original.image_url ? (
                    <img
                        src={row.original.image_url}
                        alt={getValue()}
                        className="size-12 rounded-lg object-cover"
                    />
                ) : (
                    <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                        No image
                    </div>
                )}
                <div className="flex flex-col gap-1">
                    <span className="font-medium">{getValue()}</span>
                    <span className="text-sm text-muted-foreground">
                        {row.original.category.name ?? 'Uncategorized'}
                    </span>
                </div>
            </div>
        ),
    }),
    columnHelper.accessor('sizes', {
        header: 'Sizes',
        cell: ({ getValue }) => (
            <div className="flex flex-wrap gap-2">
                {getValue().map((size) => (
                    <Badge key={size} variant="secondary">
                        {size}
                    </Badge>
                ))}
            </div>
        ),
    }),
    columnHelper.accessor('is_active', {
        header: 'Status',
        cell: ({ getValue }) => (
            <Badge variant={getValue() ? 'secondary' : 'outline'}>
                {getValue() ? 'Active' : 'Inactive'}
            </Badge>
        ),
    }),
    columnHelper.accessor('created_at', {
        header: 'Created',
        cell: ({ getValue }) => formatDateTime(getValue()),
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <Button variant="outline" size="sm" asChild>
                <Link href={edit(row.original.id)} prefetch>
                    Edit
                </Link>
            </Button>
        ),
    }),
] as never[];

export default function ProductsIndex({
    products,
    filters,
    categories,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [categoryId, setCategoryId] = useState(
        filters.category_id === '' ? 'all' : filters.category_id,
    );
    const [status, setStatus] = useState(
        filters.status === '' ? 'all' : filters.status,
    );

    return (
        <>
            <Head title="Products" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Products"
                    description="Manage clothing products, assign categories, and control the sellable size variants."
                    action={
                        <Button asChild>
                            <Link href={create()} prefetch>
                                Add product
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
                                        query: {
                                            search: search || undefined,
                                            category_id:
                                                categoryId === 'all'
                                                    ? undefined
                                                    : categoryId,
                                            status:
                                                status === 'all'
                                                    ? undefined
                                                    : status,
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
                            className="grid gap-4 lg:grid-cols-[1fr_240px_220px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="search">Search products</Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by product name"
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
                                <Label htmlFor="status-filter">Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                >
                                    <SelectTrigger
                                        id="status-filter"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                All statuses
                                            </SelectItem>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
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
                                        setStatus('all');
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
                    data={products}
                    emptyMessage="No products found."
                />
            </div>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: index(),
        },
    ],
};
