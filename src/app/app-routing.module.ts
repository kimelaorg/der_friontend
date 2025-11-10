import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import { authenticityGuard } from './DemoPages/UserPages/login-boxed/guard/authenticity-guard';
import { roleGuard } from './DemoPages/UserPages/login-boxed/guard/role-guard';
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
  Home,

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
  {path: 'der', component: Home, data: {extraParameter: 'elementsMenu'}},
  { path: '', redirectTo: '/der', pathMatch: 'full' },
  {
    path: 'der',
    component: PagesLayoutComponent,
    children: [
      { path: 'account/login', component: LoginBoxedComponent, data: { extraParameter: '' } },
      { path: 'account/register', component: RegisterBoxedComponent, data: { extraParameter: '' } },
      { path: 'account/forgot-password', component: ForgotPasswordBoxedComponent, data: { extraParameter: '' } },
      { path: 'account/otp', component: Otp, data: { extraParameter: '' } }, // YOUR REQUIRED PUBLIC ROUTE
    ]
  },
  {
    path: 'der',
    component: BaseLayoutComponent,
    canActivate: [authenticityGuard],
    children: [
      { path: '', redirectTo: 'dashboards', pathMatch: 'full' },
      { path: 'dashboards', component: AnalyticsComponent, data: { extraParameter: 'dashboardsMenu' } },
      { path: 'dashboards/clients', component: Clients, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/sales', component: Sales, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/transactions', component: Transactions, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/purchasing', component: Purchasing, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/reports', component: Reports, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/products', component: Products, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/cartegories', component: Cartegories, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/discounts', component: Discounts, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/users', component: Users, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/shipping', component: Shipping, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/orders', component: Orders, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/specifications', component: Specifications, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/expenses', component: Expenses, data: { extraParameter: 'elementsMenu' } },
      { path: 'dashboards/savings', component: Savings, data: { extraParameter: 'elementsMenu' } },
      { path: 'elements/buttons-standard', component: StandardComponent, data: { extraParameter: 'elementsMenu' } },
      { path: 'elements/dropdowns', component: DropdownsComponent, data: { extraParameter: 'elementsMenu' } },
      { path: 'elements/icons', component: IconsComponent, data: { extraParameter: 'elementsMenu' } },
      { path: 'elements/cards', component: CardsComponent, data: { extraParameter: 'elementsMenu' } },
      { path: 'elements/list-group', component: ListGroupsComponent, data: { extraParameter: 'elementsMenu' } },
      { path: 'elements/timeline', component: TimelineComponent, data: { extraParameter: 'elementsMenu' } },
      { path: 'components/tabs', component: TabsComponent, data: { extraParameter: 'componentsMenu' } },
      { path: 'components/accordions', component: AccordionsComponent, data: { extraParameter: 'componentsMenu' } },
      { path: 'components/carousel', component: CarouselComponent, data: { extraParameter: 'componentsMenu' } },
      { path: 'components/modals', component: ModalsComponent, data: { extraParameter: 'componentsMenu' } },
      { path: 'components/pagination', component: PaginationComponent, data: { extraParameter: 'componentsMenu' } },
      { path: 'components/progress-bar', component: ProgressBarComponent, data: { extraParameter: 'componentsMenu' } },
      { path: 'components/tooltips-popovers', component: TooltipsPopoversComponent, data: { extraParameter: 'componentsMenu' } },
      { path: 'charts/chartjs', component: ChartjsComponent, data: { extraParameter: 'chartsMenu' } },
      { path: 'forms/controls', component: ControlsComponent, data: { extraParameter: 'formsMenu' } },
      { path: 'forms/layouts', component: LayoutComponent, data: { extraParameter: 'formsMenu' } },
      { path: 'tables/regular', component: RegularComponent, data: { extraParameter: 'tablesMenu' } },
      { path: 'tables/bootstrap', component: TablesMainComponent, data: { extraParameter: 'tablesMenu' } },
      { path: 'widgets/chart-boxes-3', component: ChartBoxes3Component, data: { extraParameter: 'widgetsMenu' } },
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
