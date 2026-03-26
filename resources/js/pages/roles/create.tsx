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
import { create, index } from '@/routes/roles';

type Props = {
    permissions: string[];
};

export default function CreateRole({ permissions }: Props) {
    return (
        <>
            <Head title="Create role" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Create role"
                    description="Define a new reusable permission bundle for your team."
                />

                <Form
                    {...RoleController.store.form()}
                    className="flex flex-col gap-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Role details</CardTitle>
                                    <CardDescription>
                                        Give the role a clear business-facing
                                        name.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                    <Label htmlFor="name">Role name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Manager"
                                    />
                                    <InputError message={errors.name} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Permissions</CardTitle>
                                    <CardDescription>
                                        Choose every permission this role should
                                        grant.
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
                                    Create role
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CreateRole.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: index(),
        },
        {
            title: 'Create role',
            href: create(),
        },
    ],
};
