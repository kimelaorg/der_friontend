import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from './shared.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Component imports
import { AccordionsComponent } from './DemoPages/Components/accordions/accordions.component';
import { TabsComponent } from './DemoPages/Components/tabs/tabs.component';
import { CarouselComponent } from './DemoPages/Components/carousel/carousel.component';
import { ModalsComponent } from './DemoPages/Components/modals/modals.component';
import { PaginationComponent } from './DemoPages/Components/pagination/pagination.component';
import { ProgressBarComponent } from './DemoPages/Components/progress-bar/progress-bar.component';
import { TooltipsPopoversComponent } from './DemoPages/Components/tooltips-popovers/tooltips-popovers.component';
import { Products } from './DemoPages/Components/products/products';
import { Discounts } from './DemoPages/Components/discounts/discounts';
import { Users } from './DemoPages/Components/users/users';
import { Shipping } from './DemoPages/Components/shipping/shipping';
import { Cartegories } from './DemoPages/Components/cartegories/cartegories';
import { Specifications } from './DemoPages/Components/specifications/specifications';
import { Savings } from './DemoPages/Components/savings/savings';
import { Expenses } from './DemoPages/Components/expenses/expenses';
import { Home } from './DemoPages/Welcome/home/home';
import { Trial } from './trial/trial';
import { Stock } from './DemoPages/Components/stock/stock';
import { Screens } from './DemoPages/Welcome/screens/screens';
import { Software } from './DemoPages/Welcome/software/software';
import { Deals } from './DemoPages/Welcome/deals/deals';
import { Search } from './DemoPages/Welcome/search/search';
import { Motherboards } from './DemoPages/Welcome/motherboards/motherboards';
import { TCoins } from './DemoPages/Welcome/t-coins/t-coins';
import { Accessories } from './DemoPages/Welcome/accessories/accessories';
import { Layout } from './DemoPages/Welcome/layout/layout';
import { Base } from './DemoPages/Welcome/base/base';
import { SearchSpecific } from './DemoPages/Welcome/search-specific/search-specific';
import { Test } from './test/test';
import { ProductImage } from './DemoPages/Components/products/product-image/product-image';

@NgModule({
  declarations: [
    AccordionsComponent,
    TabsComponent,
    CarouselComponent,
    ModalsComponent,
    PaginationComponent,
    ProgressBarComponent,
    TooltipsPopoversComponent,
    Products,
    Discounts,
    Users,
    Shipping,
    Cartegories,
    Specifications,
    Savings,
    Expenses,
    Home,
    Trial,
    Stock,
    Screens,
    Software,
    Deals,
    Search,
    Motherboards,
    TCoins,
    Accessories,
    Layout,
    Base,
    SearchSpecific,
    Test,
    ProductImage,
  ],
  imports: [
    SharedModule,
    NgbModule,
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
  ],
  exports: [
    AccordionsComponent,
    TabsComponent,
    CarouselComponent,
    ModalsComponent,
    PaginationComponent,
    ProgressBarComponent,
    TooltipsPopoversComponent
  ]
})
export class ComponentsModule { }
