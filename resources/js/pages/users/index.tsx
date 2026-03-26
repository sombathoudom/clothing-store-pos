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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/lib/format';
import { create, edit, index } from '@/routes/users';

type UserRow = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    all_permissions: string[];
    created_at: string | null;
};

type Props = {
    users: PaginatedData<UserRow>;
    filters: {
        search: string;
        role: string;
    };
    roles: string[];
};

const columnHelper = createColumnHelper<UserRow>();

const columns = [
    columnHelper.accessor('name', {
        header: 'User',
        cell: ({ row, getValue }) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium">{getValue()}</span>
                <span className="text-sm text-muted-foreground">
                    {row.original.email}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('roles', {
        header: 'Roles',
        cell: ({ getValue }) => (
            <div className="flex flex-wrap gap-2">
                {getValue().length > 0 ? (
                    getValue().map((role) => (
                        <Badge key={role} variant="secondary">
                            {role}
                        </Badge>
                    ))
                ) : (
                    <span className="text-sm text-muted-foreground">
                        No roles
                    </span>
                )}
            </div>
        ),
    }),
    columnHelper.accessor('permissions', {
        header: 'Direct permissions',
        cell: ({ getValue }) => (
            <span className="text-sm text-muted-foreground">
                {getValue().length > 0 ? getValue().join(', ') : 'None'}
            </span>
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

export default function UsersIndex({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [role, setRole] = useState(
        filters.role === '' ? 'all' : filters.role,
    );

    const submitFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            index.url({
                query: {
                    search: search || undefined,
                    role: role === 'all' ? undefined : role,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Users" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Users"
                    description="Manage staff accounts, role assignments, and direct permission overrides."
                    action={
                        <Button asChild>
                            <Link href={create()} prefetch>
                                Add user
                            </Link>
                        </Button>
                    }
                />

                <Card>
                    <CardContent className="pt-6">
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-4 md:grid-cols-[1fr_220px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="search">Search users</Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by name or email"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role-filter">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger
                                        id="role-filter"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="All roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">
                                                All roles
                                            </SelectItem>
                                            {roles.map((roleOption) => (
                                                <SelectItem
                                                    key={roleOption}
                                                    value={roleOption}
                                                >
                                                    {roleOption}
                                                </SelectItem>
                                            ))}
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
                                        setRole('all');
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
                    data={users}
                    emptyMessage="No users found."
                />
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: index(),
        },
    ],
};
