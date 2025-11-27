import { Injectable, inject } from '@angular/core';
import { Auth, UserDataPayload } from '../../../../DemoPages/UserPages/login-boxed/service/auth';
import { NavItem, NavGroup, MASTER_NAV_CONFIG } from './nav.config';



@Injectable({
    providedIn: 'root'
})
export class Navigation {
    private authService = inject(Auth);

    /**
     * Defines the logic to assign a menu path to a specific navigational group.
     */
    private getGroupInfo(path: string): { key: string, title: string, icon: string } {
        // This logic MUST match the way you want to organize your sidebar!
        if (path.includes('/users')) return { key: 'adminMenu', title: 'User Managements', icon: 'pe-7s-config' };
        if (path.startsWith('/reports') || path.includes('/transactions') || path.includes('/dashboards/reports')) return { key: 'reportsMenu', title: 'Reporting & Analytics', icon: 'pe-7s-graph' };
        if (path.startsWith('/finance') || path.includes('/pnl')) return { key: 'financeMenu', title: 'Financial Management', icon: 'pe-7s-cash' };
        if (path.startsWith('/sales') || path.includes('/discounts&offers') || path.includes('/dashboards/orders') || path.includes('/sales') || path.includes('/view-sales')) return { key: 'salesMenu', title: 'Sales & Orders', icon: 'pe-7s-shopbag' };
        if (path.startsWith('/der/dashboards/software-products') || path.includes('/products') || path.includes('/stock') || path.includes('/inventory') || path.includes('/inventory') || path.includes('/suppliers') || path.includes('/dashboards/purchasing')) return { key: 'inventoryMenu', title: 'Inventory & Supply', icon: 'pe-7s-box2' };
        if (path.startsWith('/service')) return { key: 'serviceMenu', title: 'Service Desk', icon: 'pe-7s-tools' };
        if (path.startsWith('/content')) return { key: 'contentMenu', title: 'Content Management', icon: 'pe-7s-video' };
        // if (path.startsWith('/dashboards/orders&Tracking')) return { key: 'contentMenu', title: 'My Orders', icon: 'pe-7s-shopbag' };
        if (path.startsWith('/my')) return { key: 'profileMenu', title: 'My data', icon: 'pe-7s-user' };
        if (path.includes('/expenses') || path.includes('/savings')) return { key: 'profileMenu', title: 'Expenses & Savings', icon: 'pe-7s-wallet' };

        // Default category for items that don't fit
        return { key: 'generalMenu', title: 'General Pages', icon: 'pe-7s-browser' };
    }


    /**
     * @returns A flat, unique list of navigation items allowed for the user's roles.
     * (This is your original method, slightly cleaner)
     */
    getDynamicMenu(): NavItem[] {
        const userData = this.authService.getUserData() as UserDataPayload | null;

        if (!userData?.user?.groups) {
            return [];
        }

        const userGroups: string[] = userData.user.groups;
        const finalMenuMap = new Map<string, NavItem>();

        for (const group of userGroups) {
            const menuItemsForGroup = MASTER_NAV_CONFIG[group];

            if (menuItemsForGroup) {
                for (const item of menuItemsForGroup) {
                    finalMenuMap.set(item.path, item); // Ensures uniqueness by path
                }
            }
        }
        return Array.from(finalMenuMap.values());
    }

    /**
     * Generates the final grouped and filtered menu structure for the sidebar.
     * @returns An array of NavGroup objects, ready for *ngFor iteration.
     */
    getGroupedMenu(): NavGroup[] {
        const flatItems = this.getDynamicMenu(); // Get the filtered list first
        const groups: { [key: string]: NavGroup } = {};

        flatItems.forEach(item => {
            const { key, title, icon } = this.getGroupInfo(item.path);

            // Initialize the group if it doesn't exist
            if (!groups[key]) {
                groups[key] = { key, title, icon, items: [] };
            }

            // Add the item to the correct group
            groups[key].items.push(item);
        });

        // Convert the map to an array, filtering out any empty groups
        return Object.values(groups).filter(group => group.items.length > 0);
    }
}
