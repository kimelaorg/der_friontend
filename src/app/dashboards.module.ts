import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { BaseChartDirective } from 'ng2-charts';

// Dashboard Components
import { AnalyticsComponent } from './DemoPages/Dashboards/analytics/analytics.component';
import { Clients } from './DemoPages/Dashboards/clients/clients';
import { Sales } from './DemoPages/Dashboards/sales/sales';
import { Transactions } from './DemoPages/Dashboards/transactions/transactions';
import { Purchasing } from './DemoPages/Dashboards/purchasing/purchasing';
import { Reports } from './DemoPages/Dashboards/reports/reports';

@NgModule({
  declarations: [
    AnalyticsComponent,
    Clients,
    Sales,
    Transactions,
    Purchasing,
    Reports
  ],
  imports: [
    SharedModule,
    BaseChartDirective
  ],
  exports: [
    AnalyticsComponent
  ]
})
export class DashboardsModule { }