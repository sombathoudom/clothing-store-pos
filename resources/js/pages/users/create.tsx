import { Form, Head, Link } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/UserController';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create, index } from '@/routes/users';

type Props = {
    roles: string[];
    permissions: string[];
};

export default function CreateUser({ roles, permissions }: Props) {
    return (
        <>
            <Head title="Create user" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Create user"
                    description="Add a staff account and define its role-based and direct permission access."
                />

                <Form
                    {...UserController.store.form()}
                    className="flex flex-col gap-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account details</CardTitle>
                                    <CardDescription>
                                        Basic login credentials for the staff
                                        member.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Staff name"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="staff@example.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">
                                            Confirm password
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type="password"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Roles</CardTitle>
                                    <CardDescription>
                                        Roles are the main way to bundle
                                        operational permissions.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3 md:grid-cols-2">
                                    {roles.map((role) => (
                                        <label
                                            key={role}
                                            className="flex items-start gap-3 rounded-lg border p-3"
                                        >
                                            <Checkbox
                                                id={`role-${role}`}
                                                name="roles[]"
                                                value={role}
                                            />
                                            <span className="flex flex-col gap-1">
                                                <span className="font-medium">
                                                    {role}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    Assign this role to inherit
                                                    its bundled permissions.
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                    <InputError message={errors.roles} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Direct permissions</CardTitle>
                                    <CardDescription>
                                        Use direct permissions for specific
                                        overrides outside the user&apos;s
                                        assigned roles.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {permissions.map((permission) => (
                                        <label
                                            key={permission}
                                            className="flex items-start gap-3 rounded-lg border p-3"
                                        >
                                            <Checkbox
                                                id={`permission-${permission}`}
                                                name="permissions[]"
                                                value={permission}
                                            />
                                            <span className="text-sm font-medium">
                                                {permission}
                                            </span>
                                        </label>
                                    ))}
                                    <InputError message={errors.permissions} />
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={index()} prefetch>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button disabled={processing}>
                                    Create user
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: index(),
        },
        {
            title: 'Create user',
            href: create(),
        },
    ],
};
