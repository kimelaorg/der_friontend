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

@NgModule({
  declarations: [
    AnalyticsComponent,
    Clients,
    Sales,
    Transactions,
    Purchasing,
    Reports,
    GroupPipe,
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
    GroupPipe
  ]
})
export class DashboardsModule { }
