import { Link, usePage } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
import { navGroupsByRole, visibleNavGroups } from '@/lib/navigation';
import { dashboard, home } from '@/routes';
import type { NavItem, StaffPermission } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'View public site',
        href: home(),
        icon: Globe,
    },
];

export function AppSidebar() {
    const { auth, workspace } = usePage<{
        workspace?: {
            owner_name: string;
            permissions: StaffPermission[];
        } | null;
    }>().props;
    const navGroups = visibleNavGroups(
        navGroupsByRole[auth.user.role],
        workspace?.permissions ?? null,
    );

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
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
