import { Form, Head, Link } from '@inertiajs/react';
import RoleController from '@/actions/App/Http/Controllers/RoleController';
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
import { index } from '@/routes/roles';

type EditableRole = {
    id: number;
    name: string;
    permissions: string[];
};

type Props = {
    role: EditableRole;
    permissions: string[];
};

export default function EditRole({ role, permissions }: Props) {
    return (
        <>
            <Head title={`Edit ${role.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${role.name}`}
                    description="Adjust the permissions bundled into this role."
                />

                <Form
                    {...RoleController.update.form(role.id)}
                    className="flex flex-col gap-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Role details</CardTitle>
                                    <CardDescription>
                                        Keep role names clear so business staff
                                        can understand them.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                    <Label htmlFor="name">Role name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={role.name}
                                    />
                                    <InputError message={errors.name} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Permissions</CardTitle>
                                    <CardDescription>
                                        Review every permission inherited by
                                        users assigned to this role.
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
                                                defaultChecked={role.permissions.includes(
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

EditRole.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: index(),
        },
        {
            title: 'Edit role',
            href: index(),
        },
    ],
};
