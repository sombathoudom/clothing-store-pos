<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $role = $request->string('role')->toString();

        $users = User::query()
            ->with('roles')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role !== '', fn ($query) => $query->role($role))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->values()->all(),
                    'permissions' => $user->getDirectPermissions()->pluck('name')->values()->all(),
                    'all_permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                    'created_at' => $user->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name')->all(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('users/create', [
            'roles' => Role::query()->orderBy('name')->pluck('name')->all(),
            'permissions' => Permission::query()->orderBy('name')->pluck('name')->all(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        $user->syncRoles($validated['roles'] ?? []);
        $user->syncPermissions($validated['permissions'] ?? []);

        return to_route('users.index')->with('flash', [
            'type' => 'success',
            'message' => 'User created successfully.',
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load('roles', 'permissions');

        return Inertia::render('users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames()->values()->all(),
                'permissions' => $user->getDirectPermissions()->pluck('name')->values()->all(),
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name')->all(),
            'permissions' => Permission::query()->orderBy('name')->pluck('name')->all(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (($validated['password'] ?? null) !== null) {
            $user->password = $validated['password'];
        }

        $user->save();

        $user->syncRoles($validated['roles'] ?? []);
        $user->syncPermissions($validated['permissions'] ?? []);

        return to_route('users.index')->with('flash', [
            'type' => 'success',
            'message' => 'User updated successfully.',
        ]);
    }
}
