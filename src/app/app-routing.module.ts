// import {NgModule} from '@angular/core';
// import {Routes, RouterModule} from '@angular/router';
// import { authenticityGuard } from './DemoPages/UserPages/login-boxed/guard/authenticity-guard';
// import {BaseLayoutComponent} from './Layout/base-layout/base-layout.component';
// import {PagesLayoutComponent} from './Layout/pages-layout/pages-layout.component';
//
// // Import all components from barrel file
// import {
//   // Dashboard components
//   AnalyticsComponent,
//   Clients,
//   Sales,
//   Transactions,
//   Purchasing,
//   Reports,
//
//
//   // Elements components
//   Products,
//   Discounts,
//   Specifications,
//   Expenses,
//   Savings,
//   Users,
//   Orders,
//   Shipping,
//   Cartegories,
//   StandardComponent,
//   DropdownsComponent,
//   CardsComponent,
//   ListGroupsComponent,
//   TimelineComponent,
//   IconsComponent,
//   Home,
//
//   // Components
//   AccordionsComponent,
//   TabsComponent,
//   CarouselComponent,
//   ModalsComponent,
//   PaginationComponent,
//   ProgressBarComponent,
//   TooltipsPopoversComponent,
//
//   // Form components
//   ControlsComponent,
//   LayoutComponent,
//
//   // Table components
//   RegularComponent,
//   TablesMainComponent,
//
//   // Widget components
//   ChartBoxes3Component,
//
//   // User pages components
//   ForgotPasswordBoxedComponent,
//   LoginBoxedComponent,
//   RegisterBoxedComponent,
//   Otp,
//
//
//   // Chart components
//   ChartjsComponent
// } from './components.barrel';
//
// const routes: Routes = [
//   {path: 'der', component: Home, data: {extraParameter: 'elementsMenu'}},
//   { path: '', redirectTo: '/der', pathMatch: 'full' },
//   {
//     path: 'der',
//     component: PagesLayoutComponent,
//     children: [
//       { path: 'account/login', component: LoginBoxedComponent, data: { extraParameter: '' } },
//       { path: 'account/register', component: RegisterBoxedComponent, data: { extraParameter: '' } },
//       { path: 'account/forgot-password', component: ForgotPasswordBoxedComponent, data: { extraParameter: '' } },
//       { path: 'account/otp', component: Otp, data: { extraParameter: '' } },
//     ]
//   },
//   {
//     path: 'der',
//     component: BaseLayoutComponent,
//     // canActivate: [authenticityGuard],
//     children: [
//       { path: '', redirectTo: 'dashboards', pathMatch: 'full' },
//       { path: 'dashboards', component: AnalyticsComponent, data: { extraParameter: 'dashboardsMenu' } },
//       { path: 'dashboards/clients', component: Clients, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/sales', component: Sales, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/transactions', component: Transactions, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/purchasing', component: Purchasing, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/reports', component: Reports, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/products', component: Products, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/cartegories', component: Cartegories, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/discounts', component: Discounts, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/users', component: Users, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/shipping', component: Shipping, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/orders', component: Orders, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/specifications', component: Specifications, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/expenses', component: Expenses, data: { extraParameter: 'elementsMenu' } },
//       { path: 'dashboards/savings', component: Savings, data: { extraParameter: 'elementsMenu' } },
//       { path: 'elements/buttons-standard', component: StandardComponent, data: { extraParameter: 'elementsMenu' } },
//       { path: 'elements/dropdowns', component: DropdownsComponent, data: { extraParameter: 'elementsMenu' } },
//       { path: 'elements/icons', component: IconsComponent, data: { extraParameter: 'elementsMenu' } },
//       { path: 'elements/cards', component: CardsComponent, data: { extraParameter: 'elementsMenu' } },
//       { path: 'elements/list-group', component: ListGroupsComponent, data: { extraParameter: 'elementsMenu' } },
//       { path: 'elements/timeline', component: TimelineComponent, data: { extraParameter: 'elementsMenu' } },
//       { path: 'components/tabs', component: TabsComponent, data: { extraParameter: 'componentsMenu' } },
//       { path: 'components/accordions', component: AccordionsComponent, data: { extraParameter: 'componentsMenu' } },
//       { path: 'components/carousel', component: CarouselComponent, data: { extraParameter: 'componentsMenu' } },
//       { path: 'components/modals', component: ModalsComponent, data: { extraParameter: 'componentsMenu' } },
//       { path: 'components/pagination', component: PaginationComponent, data: { extraParameter: 'componentsMenu' } },
//       { path: 'components/progress-bar', component: ProgressBarComponent, data: { extraParameter: 'componentsMenu' } },
//       { path: 'components/tooltips-popovers', component: TooltipsPopoversComponent, data: { extraParameter: 'componentsMenu' } },
//       { path: 'charts/chartjs', component: ChartjsComponent, data: { extraParameter: 'chartsMenu' } },
//       { path: 'forms/controls', component: ControlsComponent, data: { extraParameter: 'formsMenu' } },
//       { path: 'forms/layouts', component: LayoutComponent, data: { extraParameter: 'formsMenu' } },
//       { path: 'tables/regular', component: RegularComponent, data: { extraParameter: 'tablesMenu' } },
//       { path: 'tables/bootstrap', component: TablesMainComponent, data: { extraParameter: 'tablesMenu' } },
//       { path: 'widgets/chart-boxes-3', component: ChartBoxes3Component, data: { extraParameter: 'widgetsMenu' } },
//     ]
//   },
//
//   { path: '**', redirectTo: '/der' }
// ];
//
//
// @NgModule({
//   imports: [RouterModule.forRoot(routes, {
//     scrollPositionRestoration: 'enabled',
//     anchorScrolling: 'enabled'
//   })],
//   exports: [RouterModule]
// })
// export class AppRoutingModule {
// }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// IMPORTANT: Assuming the updated guard is saved here,
// if you renamed it to `authenticationGuard` (as suggested) update this path
import { authenticityGuard } from './DemoPages/UserPages/login-boxed/guard/authenticity-guard';
// Note: If you renamed it to just `auth.guard.ts`, the import path will change.

import { BaseLayoutComponent } from './Layout/base-layout/base-layout.component';
import { PagesLayoutComponent } from './Layout/pages-layout/pages-layout.component';

// ... (other imports remain the same) ...
import {
    // ... (All your component imports)
    AnalyticsComponent,
    Clients,
    Sales,
    Transactions,
    Purchasing,
    Reports,
    Users,
    Orders,
    Shipping,
    Products,
    Discounts,
    Specifications,
    Expenses,
    Savings,
    Cartegories,
    StandardComponent,
    DropdownsComponent,
    CardsComponent,
    ListGroupsComponent,
    TimelineComponent,
    IconsComponent,
    // ... (rest of your components) ...
    LoginBoxedComponent,
    RegisterBoxedComponent,
    ForgotPasswordBoxedComponent,
    Stock,
    Otp,
    Home,
    Trial,
    Mega
} from './components.barrel';


const routes: Routes = [
    { path: 'der', component: Home, data: { extraParameter: 'elementsMenu' } },
    { path: '', redirectTo: '/der', pathMatch: 'full' },

    // --- PUBLIC ROUTES (No Guard) ---
    {
        path: 'der',
        component: PagesLayoutComponent,
        children: [
            { path: 'account/login', component: LoginBoxedComponent, data: { extraParameter: '' } },
            { path: 'account/register', component: RegisterBoxedComponent, data: { extraParameter: '' } },
            { path: 'account/forgot-password', component: ForgotPasswordBoxedComponent, data: { extraParameter: '' } },
            { path: 'account/otp', component: Otp, data: { extraParameter: '' } },
            { path: 'trial', component: Trial, data: { extraParameter: '' } },
            { path: 'mega', component: Mega, data: { extraParameter: '' } },
        ]
    },

    // --- PROTECTED ROUTES (Requires Authentication) ---
    {
        path: 'der',
        component: BaseLayoutComponent,
        // Apply the guard here to protect all child routes under BaseLayoutComponent
        canActivate: [authenticityGuard],
        children: [
            { path: '', redirectTo: 'dashboards', pathMatch: 'full' },

            // ----------------------------------------------------
            // CORE DASHBOARDS (Potentially accessible by many roles)
            // ----------------------------------------------------
            {
                path: 'dashboards',
                component: AnalyticsComponent,
                data: {
                    extraParameter: 'dashboardsMenu',
                    // Example: Default dashboard is visible to Executives and Reporting Analysts
                    allowedRoles: ['Executive Manager', 'Reporting Analyst']
                }
            },

            // ----------------------------------------------------
            // FINANCIAL/EXECUTIVE ROUTES
            // ----------------------------------------------------
            {
                path: 'dashboards/clients',
                component: Clients,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['Executive Manager', 'Financial Controller']
                }
            },
            {
                path: 'dashboards/transactions',
                component: Transactions,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['Financial Controller', 'Reporting Analyst']
                }
            },

            // ----------------------------------------------------
            // SALES & SUPPLY CHAIN ROUTES
            // ----------------------------------------------------
            {
                path: 'dashboards/sales',
                component: Sales,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['Sales Representative', 'Executive Manager', 'Reporting Analyst']
                }
            },
            {
                path: 'dashboards/purchasing',
                component: Purchasing,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['Purchasing Agent', 'Warehouse/Logistics Manager']
                }
            },
            {
                path: 'dashboards/shipping',
                component: Shipping,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['Warehouse/Logistics Manager']
                }
            },
            {
                path: 'dashboards/orders',
                component: Orders,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['Sales Representative', 'Warehouse/Logistics Manager', 'Customer']
                }
            },

            // ----------------------------------------------------
            // ADMINISTRATIVE & REPORTING ROUTES
            // ----------------------------------------------------
            {
                path: 'dashboards/reports',
                component: Reports,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['Reporting Analyst', 'Executive Manager']
                }
            },
            {
                path: 'dashboards/users',
                component: Users,
                data: {
                    extraParameter: 'elementsMenu',
                    allowedRoles: ['System Administrator']
                }
            },

            // ----------------------------------------------------
            // GENERIC/UTILITY ROUTES (Example of non-role restricted pages)
            // ----------------------------------------------------
            { path: 'dashboards/products', component: Products, data: { extraParameter: 'elementsMenu' } },
            { path: 'dashboards/cartegories', component: Cartegories, data: { extraParameter: 'elementsMenu' } },
            { path: 'dashboards/discounts&offers', component: Discounts, data: { extraParameter: 'elementsMenu' } },
            { path: 'dashboards/specifications', component: Specifications, data: { extraParameter: 'elementsMenu' } },
            { path: 'dashboards/expenses', component: Expenses, data: { extraParameter: 'elementsMenu' } },
            { path: 'dashboards/savings', component: Savings, data: { extraParameter: 'elementsMenu' } },
            { path: 'dashboards/stock', component: Stock, data: { extraParameter: 'elementsMenu' } },
            // ... (rest of your routes, adding roles as needed) ...

            // Example of a route protected by only the parent guard (any authenticated user)
            { path: 'elements/buttons-standard', component: StandardComponent, data: { extraParameter: 'elementsMenu' } },
            { path: 'elements/dropdowns', component: DropdownsComponent, data: { extraParameter: 'elementsMenu' } },
            // ... (rest of the generic routes) ...
        ]
    },

    { path: '**', redirectTo: '/der' }
];


@NgModule({
    imports: [RouterModule.forRoot(routes, {
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
    })],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
