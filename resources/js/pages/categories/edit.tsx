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
import { edit as editRoute, index, update } from '@/routes/categories';

type Props = {
    category: {
        id: number;
        name: string;
        slug: string;
        is_active: boolean;
    };
};

export default function EditCategory({ category }: Props) {
    const form = useForm({
        name: category.name,
        is_active: category.is_active,
    });

    return (
        <>
            <Head title={`Edit ${category.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${category.name}`}
                    description="Update category naming and activation without losing its product history."
                />

                <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(update.url(category.id), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Category details</CardTitle>
                            <CardDescription>
                                The slug regenerates automatically from the
                                category name when needed.
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
                                />
                                <p className="text-sm text-muted-foreground">
                                    Current slug: {category.slug}
                                </p>
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
                                        Disable categories that should no longer
                                        appear in new product workflows.
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
                        <Button disabled={form.processing}>Save changes</Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EditCategory.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: index(),
        },
        {
            title: 'Edit category',
            href: editRoute({ category: 0 }),
        },
    ],
};
