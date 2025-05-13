// src/contexts/LoginModalContext.js
import { createContext, useContext, useState } from "react";
import LoginModal from "../components/LoginModal";

const LoginModalContext = createContext();

export function LoginModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginModal = () => setIsOpen(true);
  const closeLoginModal = () => setIsOpen(false);

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}
      {isOpen && <LoginModal onClose={closeLoginModal} />}
    </LoginModalContext.Provider>
  );
}

export const useLoginModal = () => useContext(LoginModalContext);
