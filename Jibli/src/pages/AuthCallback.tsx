import { useCommerceCopy } from "../i18n/commerceCopy";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ensureUserProfile, safeNextPath } from "../auth";
import { supabase } from "../supabase";
import logo from "../assets/Fast-Logo.gif";

function AuthCallback() {
  const navigate = useNavigate();
  const copy = useCommerceCopy();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const finishLogin = async () => {
      const nextPath = safeNextPath(searchParams.get("next"));
      const code = searchParams.get("code");
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const authError = searchParams.get("error_description") || searchParams.get("error") || hashParams.get("error_description") || hashParams.get("error");

      if (authError) {
        throw new Error(authError);
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!data.session) {
        throw new Error("Login did not complete. Check the Supabase redirect URL and provider settings.");
      }

      await ensureUserProfile();

      if (isMounted) {
        navigate(nextPath, { replace: true });
      }
    };

    finishLogin().catch((error) => {
      if (isMounted) {
        setErrorMessage(error instanceof Error ? error.message : "Could not finish login.");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="authPage">
      <header className="authTopbar">
        <Link to="/" className="authBrand">
          <img src={logo} alt="Jibli logo" className="logoImg" />
          <span>Jibli</span>
        </Link>
      </header>

      <div className="authCard">
        <img src={logo} alt="Jibli logo" className="authCardLogo" />
        <h1>{copy("Finishing login")}</h1>
        <p>{copy("Please wait while we connect your account.")}</p>
        {errorMessage && <div className="authError">{errorMessage}</div>}
        {errorMessage && (
          <Link to="/login" className="registerAccountBtn">
            {copy("Back to login")}
          </Link>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
