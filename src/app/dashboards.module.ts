import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { BaseChartDirective } from 'ng2-charts';
import { DatePipe } from '@angular/common';

// Dashboard Components
import { AnalyticsComponent } from './DemoPages/Dashboards/analytics/analytics.component';
import { Clients } from './DemoPages/Dashboards/clients/clients';
import { Sales } from './DemoPages/Dashboards/sales/sales';
import { Transactions } from './DemoPages/Dashboards/transactions/transactions';
import { Purchasing } from './DemoPages/Dashboards/purchasing/purchasing';
import { Reports } from './DemoPages/Dashboards/reports/reports';
import { GroupPipe } from './DemoPages/Dashboards/purchasing/group-pipe';
// import { SalesDatePipe } from './DemoPages/Dashboards/sales-view/sales-date-pipe';
import { SalesView } from './DemoPages/Dashboards/sales-view/sales-view';
import { Wishlists } from './DemoPages/Customer/wishlists/wishlists';
import { Reviews } from './DemoPages/Customer/reviews/reviews';
import { Purchased } from './DemoPages/Customer/purchased/purchased';
import { Orders } from './DemoPages/Customer/orders/orders';
import { Profile } from './DemoPages/Customer/profile/profile';
import { Me } from './DemoPages/Customer/me/me';

@NgModule({
  declarations: [
    AnalyticsComponent,
    Clients,
    Sales,
    Transactions,
    Purchasing,
    Reports,
    GroupPipe,
    // SalesDatePipe,
    SalesView,
    Wishlists,
    Reviews,
    Purchased,
    Orders,
    Profile,
    Me,
  ],
  imports: [
    SharedModule,
    BaseChartDirective
  ],
  providers: [
    // NEW: Provide DatePipe so GroupPipe can inject it
    DatePipe
  ],
  exports: [
    AnalyticsComponent,
    GroupPipe,
    // SalesDatePipe
  ]
})
export class DashboardsModule { }
