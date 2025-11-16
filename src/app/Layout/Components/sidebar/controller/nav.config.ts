export interface NavItem {
    path: string;
    title: string;
}

export interface RoleMenu {
    [roleName: string]: NavItem[];
}

export interface NavGroup {
    title: string;
    key: string;
    icon: string;
    items: NavItem[];
}

// Master mapping of ALL menu items associated with ALL roles
// NOTE: Roles must EXACTLY match the 'groups' array returned in your user_data payload.
export const MASTER_NAV_CONFIG: RoleMenu = {
    // --- System Administrator ---
    "System Administrator": [
        // This group will likely need custom routes not defined in your dashboards/ links
        { path: "/der/dashboards/users", title: "Manage Staff" }, // Maps to Manage Staff from original HTML
        { path: "/der/admin/settings", title: "System Configuration" },
        { path: "/der/admin/audit", title: "Security & Audit Logs" },

    ],

    // --- Executive Manager ---
    "Executive Manager": [
        { path: "/der/dashboards", title: "Executive Dashboard" }, // AnalyticsComponent
        { path: "/der/dashboards/reports", title: "KPMs & Performance" },
        { path: "/der/dashboards/transactions", title: "Financial Summary" }, // TransactionsComponent
    ],

    // --- Financial Controller ---
    "Financial Controller": [
        { path: "/der/dashboards/clients", title: "Clients & Payments" }, // ClientsComponent
        { path: "/der/dashboards/transactions", title: "Transaction Reconciliation" },
        { path: "/der/dashboards/expenses", title: "Manage Expenses" },
        { path: "/der/dashboards/savings", title: "Manage Savings" },
    ],

    // --- Reporting Analyst ---
    "Reporting Analyst": [
        { path: "/der/dashboards/reports", title: "Reports Dashboard" },
        { path: "/der/forms/layouts", title: "Custom Report Builder" }, // Using a generic form route
        { path: "/der/tables/regular", title: "Data Export Tool" }, // Using a generic table route
    ],

    // --- Sales Representative ---
    "Sales Representative": [
        { path: "/der/dashboards/sales", title: "Sales Overview" },
        { path: "/der/dashboards/orders", title: "Manage Orders" },
        { path: "/der/dashboards/discounts", title: "Discounts & Offers" },
    ],

    // --- Purchasing Agent ---
    "Purchasing Agent": [
        { path: "/der/dashboards/purchasing", title: "Create Purchase Order" },
        { path: "/der/dashboards/shipping", title: "Supplier Management" },
        { path: "/der/dashboards/specifications", title: "Manage Specifications" }, // Using shipping route conceptually
        { path: "/der/dashboards/products", title: "Manage Products" },
        { path: "/der/dashboards/cartegories", title: "Manage categories" },
    ],

    // --- Warehouse/Logistics Manager ---
    "Warehouse/Logistics Manager": [
        { path: "/der/dashboards/shipping", title: "Shipping Queue" },
        { path: "/der/dashboards/products", title: "Stock Levels" },
        { path: "/der/dashboards/cartegories", title: "Receive Goods" }, // Using cartegories route conceptually
    ],

    // --- Front Desk / Service Agent (Combining into a generic service route) ---
    "Front Desk / Service Agent": [
        { path: "/der/components/tabs", title: "Log New Service Ticket" }, // Using generic component route
        { path: "/der/components/modals", title: "Search Tickets" },
        { path: "/der/components/accordions", title: "Appointment Scheduling" },
    ],

    // --- Repair Technician ---
    "Repair Technician": [
        { path: "/der/components/tabs", title: "My Job Queue" },
        { path: "/der/components/modals", title: "Update Job Progress" },
        { path: "/der/components/accordions", title: "Parts Request" },
    ],

    // --- Service Manager ---
    "Service Manager": [
        { path: "/der/components/tabs", title: "All Service Tickets" },
        { path: "/der/components/modals", title: "Tech Performance" },
        { path: "/der/components/accordions", title: "Quote Approvals" },
    ],

    // --- Content Creator / Author & Content Editor / Reviewer (Retaining for future custom routes) ---
    "Content Creator / Author": [
        { path: "/der/forms/controls", title: "Create Content" },
        { path: "/der/forms/layouts", title: "View Drafts" },
    ],
    "Content Editor / Reviewer": [
        { path: "/der/forms/controls", title: "Content Review Queue" },
        { path: "/der/forms/layouts", title: "Manage Published Content" },
    ],

    // --- Customer ---
    "Customer": [
        { path: "/der/dashboards/orders", title: "My Orders & Tracking" },
        { path: "/der/elements/cards", title: "My Purchased Content" },
        { path: "/der/elements/list-group", title: "My Wishlist" },
        { path: "/der/elements/timeline", title: "My Reviews" },
    ],
};
