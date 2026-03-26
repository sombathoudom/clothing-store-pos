import { Head, Link, useForm } from '@inertiajs/react';
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
import { create, index, store } from '@/routes/categories';

export default function CreateCategory() {
    const form = useForm({
        name: '',
        is_active: true,
    });

    return (
        <>
            <Head title="Create category" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Create category"
                    description="Add a catalog category that products can be grouped under."
                />

                <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(store.url(), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Category details</CardTitle>
                            <CardDescription>
                                Use a clear business-facing name so staff can
                                filter and find products quickly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Category name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder="Hawai Shirt"
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <label className="flex items-start gap-3 rounded-lg border p-4">
                                <Checkbox
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_active',
                                            checked === true,
                                        )
                                    }
                                />
                                <span className="flex flex-col gap-1">
                                    <span className="font-medium">
                                        Active category
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Inactive categories stay in history but
                                        are hidden from new operational flows.
                                    </span>
                                </span>
                            </label>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={index()} prefetch>
                                Cancel
                            </Link>
                        </Button>
                        <Button disabled={form.processing}>
                            Create category
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateCategory.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: index(),
        },
        {
            title: 'Create category',
            href: create(),
        },
    ],
};
