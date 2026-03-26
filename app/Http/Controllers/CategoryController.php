<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        $categories = Category::query()
            ->withCount('products')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->when($status !== '', fn ($query) => $query->where('is_active', $status === 'active'))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'is_active' => $category->is_active,
                'products_count' => $category->products_count,
                'created_at' => $category->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('categories/index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('categories/create');
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Category::create([
            'name' => $validated['name'],
            'slug' => $this->makeSlug($validated['name']),
            'is_active' => (bool) $validated['is_active'],
        ]);

        return to_route('categories.index')->with('flash', [
            'type' => 'success',
            'message' => 'Category created successfully.',
        ]);
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('categories/edit', [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'is_active' => $category->is_active,
            ],
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        $category->update([
            'name' => $validated['name'],
            'slug' => $this->makeSlug($validated['name'], $category),
            'is_active' => (bool) $validated['is_active'],
        ]);

        return to_route('categories.index')->with('flash', [
            'type' => 'success',
            'message' => 'Category updated successfully.',
        ]);
    }

    private function makeSlug(string $name, ?Category $category = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $suffix = 1;

        while (Category::query()
            ->when($category !== null, fn ($query) => $query->whereKeyNot($category))
            ->where('slug', $slug)
            ->exists()) {
            $slug = sprintf('%s-%d', $originalSlug, $suffix);
            $suffix++;
        }

        return $slug;
    }
}
