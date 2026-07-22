import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Account from "./pages/Account.tsx";
import ProductRequest from "./pages/ProductRequest.tsx";
import OrderTracking from "./pages/OrderTracking.tsx";
import GamingStore from "./pages/GamingStore.tsx";
import AboutUs from "./pages/AboutUs.tsx";
import Contact from "./pages/Contact.tsx";
import AdminDashboard from "./pages/AdminDashboard";
import { isAdminEmail } from "./admin";
import { getCurrentSession } from "./auth";
import "./App.css";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentSession()
      .then((session) => {
        if (isMounted) {
          setIsAuthenticated(Boolean(session));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingAuth) {
    return <div className="routeLoading">Checking your account...</div>;
  }

  if (isAuthenticated) {
    return children;
  }

  const nextPath = `${location.pathname}${location.search}`;

  return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
}

function GuestRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentSession()
      .then((session) => {
        if (isMounted) {
          setIsAuthenticated(Boolean(session));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingAuth) {
    return <div className="routeLoading">Checking your account...</div>;
  }

  if (!isAuthenticated) {
    return children;
  }

  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get("next");

  return <Navigate to={nextPath || "/account"} replace />;
}

// /order used to be a separate, login-free page; it's now merged into
// /request so every request is saved and visible in the admin dashboard.
// This keeps any already-shared /order links working.
function OrderRedirect() {
  const location = useLocation();
  return <Navigate to={`/request${location.search}`} replace />;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      const session = await getCurrentSession();

      if (!session) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
        return;
      }

      if (isMounted) {
        setIsAuthenticated(true);
        setIsAdmin(isAdminEmail(session.user.email));
      }
    };

    checkAdmin()
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingAuth) {
    return <div className="routeLoading">Checking admin access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?next=%2Fadmin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <ProductRequest />
            </ProtectedRoute>
          }
        />
        <Route path="/order" element={<OrderRedirect />} />
        <Route path="/gaming" element={<GamingStore />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
