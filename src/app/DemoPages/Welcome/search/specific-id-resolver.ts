import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ProductData } from './product';
import { IProduct } from './data02';

export const specificIdResolver: ResolveFn<IProduct> = (route, state) => {
  const everest = inject(ProductData);
  const _id = route.paramMap.get('id')!;

  return everest.singleItem(_id);
};
