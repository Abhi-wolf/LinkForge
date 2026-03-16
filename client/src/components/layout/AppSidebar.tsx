import { NavLink } from 'react-router-dom';
import { Home, Link as LinkIcon, Settings } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const items = [
    {
        title: "Dashboard",
        url: "/dashboard/overview",
        icon: Home,
    },
    {
        title: "My Links",
        url: "/dashboard/links",
        icon: LinkIcon,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
];

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <div className="p-4 px-6 flex items-center gap-2 text-xl font-bold border-b mb-4">
                        <LinkIcon className="h-6 w-6 text-primary" />
                        <span>LinkForge</span>
                    </div>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            className={({ isActive }) =>
                                                isActive ? "bg-muted text-primary font-medium" : ""
                                            }
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

