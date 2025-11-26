import { HttpClient } from '@angular/common/http';
import { Inject, inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { IProduct, product_data } from './data02';


@Injectable({
  providedIn: 'root',
})
export class ProductData {

  API = 'http://127.0.0.1:8000/api/products/public-catalog';

  private readonly http = inject(HttpClient);

  private brandsSubject = new BehaviorSubject<string[]>([]);
  brands$ = this.brandsSubject.asObservable();

  private randomItems = new BehaviorSubject<IProduct[]>([]);
  random$ = this.randomItems.asObservable();

  getProducts() {
    return this.http
      .get<product_data>(`${this.API}/all?page_size=50`)
      .pipe(
        tap((res) => {
          const brands = res.products
            .map((product) => product)
            .filter((value, index, self) => self.indexOf(value) === index)
            .filter(
              (brand) =>
                res.products.filter((product) => product === brand)
                  .length >= 3
            );

          // მხოლოდ ბრენდების სახელი
          // this.brandsSubject.next(brands);

          // რენდომული 3 აითემი
          this.randomItems.next(
            res.products.sort(() => Math.random() - 0.5).slice(0, 3)
          );
        }),
        map((res) => res.products)
      );
  }

  searchProducts(query?: string) {
    return this.http
      .get<product_data>(
        `${this.API}/?search=${query}`
      )
      .pipe(map((res) => res.products));
  }

  productWithId(id: string) {
    return this.http.get<IProduct>(`${this.API}/${id}`);
  }

  singleItem(_id: string) {
    return this.http.get<IProduct>(`${this.API}/${_id}`);
  }

  searchProduct(
    _querry: string,
    page_index: number = 1,
    price_max: number = 10000,
    page_size: number = 10,
    sort_by: string = 'price',
    sort_dir: string = 'asc'
  ) {
    return this.http.get<product_data>(
      `${this.API}/?search=${_querry}&page_size=${page_size}&page_index=${page_index}&price_max=${price_max}&sort_by=${sort_by}&sort_direction=${sort_dir}`
    );
  }

  loadBrands() {
    return this.http.get<string>(`${this.API}/shop/products/brands`);
  }

  getCategory(_id: string) {
    return this.http.get<product_data>(
      `${this.API}/shop/products/category/${_id}`
    );
  }

}
