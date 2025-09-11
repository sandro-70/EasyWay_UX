import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const incrementCart = (n = 1) => setCartCount((prev) => prev + n);
  const decrementCart = (n = 1) => setCartCount((prev) => prev - n);
  const setCount = (n) => setCartCount((prev) => n);

  return (
    <CartContext.Provider value={{ cartCount, setCount, incrementCart, decrementCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
