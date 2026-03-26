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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { create, index, store } from '@/routes/products';

type Props = {
    categories: Array<{
        id: string;
        name: string;
    }>;
    sizes: string[];
};

export default function CreateProduct({ categories, sizes }: Props) {
    const form = useForm({
        category_id: categories[0]?.id ?? '',
        name: '',
        image: null as File | null,
        is_active: true,
        sizes: [] as string[],
    });

    const toggleSize = (size: string, checked: boolean) => {
        form.setData(
            'sizes',
            checked
                ? [...form.data.sizes, size]
                : form.data.sizes.filter((value) => value !== size),
        );
    };

    return (
        <>
            <Head title="Create product" />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Create product"
                    description="Create a product, place it in a category, and select the sizes that will become sellable variants."
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
                            <CardTitle>Product details</CardTitle>
                            <CardDescription>
                                Keep product naming clean so staff can search
                                and sell quickly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select
                                    value={form.data.category_id}
                                    onValueChange={(value) =>
                                        form.setData('category_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="category_id"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                                <InputError message={form.errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Product name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder="Hawai Premium"
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="image">Product image</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        form.setData(
                                            'image',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <InputError message={form.errors.image} />
                            </div>

                            <label className="flex items-start gap-3 rounded-lg border p-4 md:col-span-2">
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
                                        Active product
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Inactive products remain in history but
                                        should not appear in new operational
                                        flows.
                                    </span>
                                </span>
                            </label>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Size variants</CardTitle>
                            <CardDescription>
                                Each selected size creates a product variant
                                that can receive stock and be sold.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                            {sizes.map((size) => (
                                <label
                                    key={size}
                                    className="flex items-start gap-3 rounded-lg border p-4"
                                >
                                    <Checkbox
                                        checked={form.data.sizes.includes(size)}
                                        onCheckedChange={(checked) =>
                                            toggleSize(size, checked === true)
                                        }
                                    />
                                    <span className="font-medium">{size}</span>
                                </label>
                            ))}
                            <InputError message={form.errors.sizes} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={index()} prefetch>
                                Cancel
                            </Link>
                        </Button>
                        <Button disabled={form.processing}>
                            Create product
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateProduct.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: index(),
        },
        {
            title: 'Create product',
            href: create(),
        },
    ],
};
