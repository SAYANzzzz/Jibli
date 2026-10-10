const GuestInvitation = lazy(() => import("./pages/GuestInvitation"));
const OtherInvitations = lazy(() => import("./pages/OtherInvitations"));
const Payment = lazy(() => import("./pages/Payment"));
import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
const Home = lazy(() => import("./pages/Home.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const AuthCallback = lazy(() => import("./pages/AuthCallback.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const ProductRequest = lazy(() => import("./pages/ProductRequest.tsx"));
const OrderTracking = lazy(() => import("./pages/OrderTracking.tsx"));
const GamingStore = lazy(() => import("./pages/GamingStore.tsx"));
const Invitations = lazy(() => import("./pages/Invitations.tsx"));
const WeddingInvitations = lazy(() => import("./pages/WeddingInvitations.tsx"));
const EngagementInvitations = lazy(() => import("./pages/EngagementInvitations.tsx"));
const BirthdayInvitations = lazy(() => import("./pages/BirthdayInvitations.tsx"));
const BusinessOpeningInvitations = lazy(() => import("./pages/BusinessOpeningInvitations.tsx"));
const GraduationInvitations = lazy(() => import("./pages/GraduationInvitations.tsx"));
const FamilyGatheringInvitations = lazy(() => import("./pages/FamilyGatheringInvitations.tsx"));
const AboutUs = lazy(() => import("./pages/AboutUs.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const TermsOfService = lazy(() => import("./pages/TermsOfService.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
import { getProfile } from "./api";
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
        const profile = await getProfile();
        if (isMounted) {
          setIsAuthenticated(true);
          setIsAdmin(profile.role === "admin");
        }
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
      <Suspense fallback={<div className="routeLoading">Loading?</div>}><Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invite/:token" element={<GuestInvitation />} />
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
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/order" element={<OrderRedirect />} />
        <Route path="/gaming" element={<GamingStore />} />
        <Route path="/invitations" element={<Invitations />} />
        <Route path="/invitations/weddings" element={<WeddingInvitations />} />
        <Route path="/invitations/engagements" element={<EngagementInvitations />} />
        <Route path="/invitations/birthdays" element={<BirthdayInvitations />} />
        <Route path="/invitations/openings" element={<BusinessOpeningInvitations />} />
        <Route path="/invitations/graduations" element={<GraduationInvitations />} />
        <Route path="/invitations/others" element={<OtherInvitations />} />
        <Route path="/invitations/family" element={<FamilyGatheringInvitations />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes></Suspense>
    </BrowserRouter>
  );
}

export default App;
