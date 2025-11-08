import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {BaseLayoutComponent} from './Layout/base-layout/base-layout.component';
import {PagesLayoutComponent} from './Layout/pages-layout/pages-layout.component';

// Import all components from barrel file
import {
  // Dashboard components
  AnalyticsComponent,
  Clients,
  Sales,
  Transactions,
  Purchasing,
  Reports,


  // Elements components
  Products,
  Discounts,
  Specifications,
  Expenses,
  Savings,
  Users,
  Orders,
  Shipping,
  Cartegories,
  StandardComponent,
  DropdownsComponent,
  CardsComponent,
  ListGroupsComponent,
  TimelineComponent,
  IconsComponent,

  // Components
  AccordionsComponent,
  TabsComponent,
  CarouselComponent,
  ModalsComponent,
  PaginationComponent,
  ProgressBarComponent,
  TooltipsPopoversComponent,

  // Form components
  ControlsComponent,
  LayoutComponent,

  // Table components
  RegularComponent,
  TablesMainComponent,

  // Widget components
  ChartBoxes3Component,

  // User pages components
  ForgotPasswordBoxedComponent,
  LoginBoxedComponent,
  RegisterBoxedComponent,
  Otp,


  // Chart components
  ChartjsComponent
} from './components.barrel';

const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      // Dashboards

      {path: '', redirectTo: '/dashboards', pathMatch: 'full'},
      {path: 'dashboards', component: AnalyticsComponent, data: {extraParameter: 'dashboardsMenu'}},
      {path: 'dashboards/clients', component: Clients, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/sales', component: Sales, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/transactions', component: Transactions, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/purchasing', component: Purchasing, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/reports', component: Reports, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/products', component: Products, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/cartegories', component: Cartegories, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/discounts', component: Discounts, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/users', component: Users, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/shipping', component: Shipping, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/orders', component: Orders, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/specifications', component: Specifications, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/expenses', component: Expenses, data: {extraParameter: 'elementsMenu'}},
      {path: 'dashboards/savings', component: Savings, data: {extraParameter: 'elementsMenu'}},

      // Elements
      {path: 'elements/buttons-standard', component: StandardComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/dropdowns', component: DropdownsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/icons', component: IconsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/cards', component: CardsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/list-group', component: ListGroupsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/timeline', component: TimelineComponent, data: {extraParameter: 'elementsMenu'}},

      // Components
      {path: 'components/tabs', component: TabsComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/accordions', component: AccordionsComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/carousel', component: CarouselComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/modals', component: ModalsComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/pagination', component: PaginationComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/progress-bar', component: ProgressBarComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/tooltips-popovers', component: TooltipsPopoversComponent, data: {extraParameter: 'componentsMenu'}},

      // Charts
      {path: 'charts/chartjs', component: ChartjsComponent, data: {extraParameter: 'chartsMenu'}},

      // Forms
      {path: 'forms/controls', component: ControlsComponent, data: {extraParameter: 'formsMenu'}},
      {path: 'forms/layouts', component: LayoutComponent, data: {extraParameter: 'formsMenu'}},

      // Tables
      {path: 'tables/regular', component: RegularComponent, data: {extraParameter: 'tablesMenu'}},
      {path: 'tables/bootstrap', component: TablesMainComponent, data: {extraParameter: 'tablesMenu'}},

      // Widgets
      {path: 'widgets/chart-boxes-3', component: ChartBoxes3Component, data: {extraParameter: 'widgetsMenu'}},
    ]
  },
  {
    path: '',
    component: PagesLayoutComponent,
    children: [
      // User Pages
      {path: 'pages/login-boxed', component: LoginBoxedComponent, data: {extraParameter: ''}},
      {path: 'pages/register-boxed', component: RegisterBoxedComponent, data: {extraParameter: ''}},
      {path: 'pages/forgot-password-boxed', component: ForgotPasswordBoxedComponent, data: {extraParameter: ''}},
      {path: 'pages/otp', component: Otp, data: {extraParameter: ''}},
    ]
  },
  {path: '**', redirectTo: ''}
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
