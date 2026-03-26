import { Head, Link, router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable  } from '@/components/data-table';
import type {PaginatedData} from '@/components/data-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/lib/format';
import { create, edit, index } from '@/routes/roles';

type RoleRow = {
    id: number;
    name: string;
    permissions: string[];
    created_at: string | null;
};

type Props = {
    roles: PaginatedData<RoleRow>;
    filters: {
        search: string;
    };
};

const columnHelper = createColumnHelper<RoleRow>();

const columns = [
    columnHelper.accessor('name', {
        header: 'Role',
        cell: ({ getValue }) => (
            <span className="font-medium">{getValue()}</span>
        ),
    }),
    columnHelper.accessor('permissions', {
        header: 'Permissions',
        cell: ({ getValue }) => (
            <div className="flex flex-wrap gap-2">
                {getValue().map((permission) => (
                    <Badge key={permission} variant="secondary">
                        {permission}
                    </Badge>
                ))}
            </div>
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

export default function RolesIndex({ roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    return (
        <>
            <Head title="Roles" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Roles"
                    description="Create reusable permission bundles for admins, managers, cashiers, and future staff roles."
                    action={
                        <Button asChild>
                            <Link href={create()} prefetch>
                                Add role
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
                                <Label htmlFor="search">Search roles</Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by role name"
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
                    data={roles}
                    emptyMessage="No roles found."
                />
            </div>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: index(),
        },
    ],
};
