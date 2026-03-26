import type { InertiaLinkProps } from '@inertiajs/react';
import { Link, usePage } from '@inertiajs/react';
import {
    ClipboardMinus,
    ChartColumnBig,
    CreditCard,
    LayoutGrid,
    Package2,
    Receipt,
    ReceiptText,
    Settings2,
    Shapes,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as adjustmentsIndex } from '@/routes/adjustments';
import { edit as editBusinessSettings } from '@/routes/business-settings';
import { index as categoriesIndex } from '@/routes/categories';
import { index as posIndex } from '@/routes/pos';
import { index as productsIndex } from '@/routes/products';
import { index as purchasesIndex } from '@/routes/purchases';
import { index as reportsIndex } from '@/routes/reports';
import { index as rolesIndex } from '@/routes/roles';
import { index as salesIndex } from '@/routes/sales';
import { index as stockIndex } from '@/routes/stock';
import { index as usersIndex } from '@/routes/users';
import type { NavGroup } from '@/types';

const permissionGroups: Array<{
    title: string;
    items: Array<{
        title: string;
        href: NonNullable<InertiaLinkProps['href']>;
        icon: typeof LayoutGrid;
        permission?: string;
    }>;
}> = [
    {
        title: 'Workspace',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Management',
        items: [
            {
                title: 'Users',
                href: usersIndex(),
                icon: Users,
                permission: 'manage users',
            },
            {
                title: 'Roles',
                href: rolesIndex(),
                icon: ShieldCheck,
                permission: 'manage roles',
            },
            {
                title: 'Business Settings',
                href: editBusinessSettings(),
                icon: Settings2,
                permission: 'manage business settings',
            },
        ],
    },
    {
        title: 'Catalog',
        items: [
            {
                title: 'Categories',
                href: categoriesIndex(),
                icon: Shapes,
                permission: 'manage categories',
            },
            {
                title: 'Products',
                href: productsIndex(),
                icon: Package2,
                permission: 'manage products',
            },
        ],
    },
    {
        title: 'Operations',
        items: [
            {
                title: 'Purchases',
                href: purchasesIndex(),
                icon: ReceiptText,
                permission: 'manage purchases',
            },
            {
                title: 'Stock',
                href: stockIndex(),
                icon: Package2,
                permission: 'view stock',
            },
            {
                title: 'Adjustments',
                href: adjustmentsIndex(),
                icon: ClipboardMinus,
                permission: 'manage adjustments',
            },
            {
                title: 'POS',
                href: posIndex(),
                icon: CreditCard,
                permission: 'create sales',
            },
            {
                title: 'Sales',
                href: salesIndex(),
                icon: ChartColumnBig,
                permission: 'view sales',
            },
            {
                title: 'Reports',
                href: reportsIndex(),
                icon: Receipt,
                permission: 'view dashboard',
            },
        ],
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;

    const availablePermissions = new Set(auth.user?.all_permissions ?? []);
    const groups: NavGroup[] = permissionGroups
        .map((group) => ({
            title: group.title,
            items: group.items.filter(
                (item) =>
                    item.permission === undefined ||
                    availablePermissions.has(item.permission),
            ),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <NavMain
                        key={group.title}
                        title={group.title}
                        items={group.items}
                    />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
