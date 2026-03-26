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
import { create, edit, index } from '@/routes/categories';

type CategoryRow = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    products_count: number;
    created_at: string | null;
};

type Props = {
    categories: PaginatedData<CategoryRow>;
    filters: {
        search: string;
        status: string;
    };
};

const columnHelper = createColumnHelper<CategoryRow>();

const columns = [
    columnHelper.accessor('name', {
        header: 'Category',
        cell: ({ row, getValue }) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium">{getValue()}</span>
                <span className="text-sm text-muted-foreground">
                    {row.original.slug}
                </span>
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
    columnHelper.accessor('products_count', {
        header: 'Products',
        cell: ({ getValue }) => getValue().toString(),
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

export default function CategoriesIndex({ categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(
        filters.status === '' ? 'all' : filters.status,
    );

    return (
        <>
            <Head title="Categories" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Categories"
                    description="Organize the clothing catalog into manageable groups for products, filters, and reports."
                    action={
                        <Button asChild>
                            <Link href={create()} prefetch>
                                Add category
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
                            className="grid gap-4 md:grid-cols-[1fr_220px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="search">
                                    Search categories
                                </Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by category name"
                                />
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
                    data={categories}
                    emptyMessage="No categories found."
                />
            </div>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: index(),
        },
    ],
};
