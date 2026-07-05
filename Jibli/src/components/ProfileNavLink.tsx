import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProfileNavLink() {
  const [fullName, setFullName] = useState("My account");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfileSummary = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user || !isMounted) {
        return;
      }

      const fallbackName = user.email?.split("@")[0] || "My account";

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setFullName(profile?.full_name?.trim() || fallbackName);
      setAvatarUrl(profile?.avatar_url ?? "");
    };

    loadProfileSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = getInitials(fullName) || "J";

  return (
    <Link to="/account" className="profileNavLink" aria-label="Open my account">
      <span className="profileNavAvatar">
        {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
      </span>
      <span className="profileNavName">{fullName}</span>
    </Link>
  );
}

export default ProfileNavLink;
