'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ProductId } from '@/lib/productHosts';

const ProductContext = createContext<ProductId>('mila');

export function ProductProvider({
  product,
  children,
}: {
  product: ProductId;
  children: ReactNode;
}) {
  return <ProductContext.Provider value={product}>{children}</ProductContext.Provider>;
}

export function useProduct(): ProductId {
  return useContext(ProductContext);
}
