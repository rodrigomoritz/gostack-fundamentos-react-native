import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartOfProducts = await AsyncStorage.getItem('@GoMarketPlace: cart');

      if (cartOfProducts) {
        setProducts(JSON.parse(cartOfProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findProductOnCart = products.find(item => item.id === product.id);

      if (findProductOnCart) {
        const productIndex = products.findIndex(item => item.id === product.id);

        if (productIndex >= 0) {
          products[productIndex].quantity += 1;
        }

        setProducts(products);

        await AsyncStorage.setItem(
          '@GoMarketPlace: cart',
          JSON.stringify(products),
        );
      }
      if (!findProductOnCart) {
        const newProduct: Product = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1,
        };

        setProducts([...products, newProduct]);

        await AsyncStorage.setItem(
          '@GoMarketPlace: cart',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cart = [...products];

      const productIndex = cart.findIndex(product => product.id === id);

      if (productIndex >= 0) {
        cart[productIndex].quantity += 1;

        setProducts(cart);
      }
      await AsyncStorage.setItem('@GoMarketPlace: cart', JSON.stringify(cart));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.reduce((acc, item) => {
        if (item.id !== id) {
          return [...acc, item];
        }

        if (item.quantity === 1) {
          return acc;
        }

        const updatedItem = { ...item, quantity: item.quantity - 1 };

        return [...acc, updatedItem];
      }, [] as Product[]);

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace: cart',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
