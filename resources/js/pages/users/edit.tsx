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
import { index } from '@/routes/users';

type EditableUser = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
};

type Props = {
    user: EditableUser;
    roles: string[];
    permissions: string[];
};

export default function EditUser({ user, roles, permissions }: Props) {
    return (
        <>
            <Head title={`Edit ${user.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${user.name}`}
                    description="Update staff access, assigned roles, and direct permission overrides."
                />

                <Form
                    {...UserController.update.form(user.id)}
                    className="flex flex-col gap-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account details</CardTitle>
                                    <CardDescription>
                                        Leave the password blank to keep the
                                        current credential.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={user.name}
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={user.email}
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            New password
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
                                            Confirm new password
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
                                        The user inherits all permissions
                                        granted to the selected roles.
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
                                                defaultChecked={user.roles.includes(
                                                    role,
                                                )}
                                            />
                                            <span className="font-medium">
                                                {role}
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
                                        Direct permissions add or remove access
                                        outside the user&apos;s role
                                        assignments.
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
                                                defaultChecked={user.permissions.includes(
                                                    permission,
                                                )}
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
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

EditUser.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: index(),
        },
        {
            title: 'Edit user',
            href: index(),
        },
    ],
};
