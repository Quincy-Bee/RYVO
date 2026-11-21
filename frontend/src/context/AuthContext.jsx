
import {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("ryvo_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("ryvo_user");
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("ryvo_token")
  );

  const login = (data) => {
    localStorage.setItem("ryvo_token", data.token);
    localStorage.setItem("ryvo_user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  };

  const updateUser = (updatedUser) => {
    const updatedData = {
      ...user,
      ...updatedUser,
    };

    localStorage.setItem("ryvo_user", JSON.stringify(updatedData));
    setUser(updatedData);
  };

  const logout = () => {
    localStorage.removeItem("ryvo_token");
    localStorage.removeItem("ryvo_user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isLoggedIn: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
