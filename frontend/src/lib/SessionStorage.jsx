// src/App.js  (ADD these helpers near the top)

function isAdminPathname(pathname) {
  // Works with HashRouter: pathname like "/admin/analytics"
  return pathname.startsWith("/admin");
}

// Runs once on the first mount of the app (per hard reload)
// If the first URL is /admin/* and no opt-in flag is set, redirect to Home.
function AdminReloadGuard() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    // Only run once on boot
    if (sessionStorage.getItem("__bootChecked")) return;
    sessionStorage.setItem("__bootChecked", "1");

    const allow = sessionStorage.getItem("__allowAdminReload") === "1";
    const onAdmin = isAdminPathname(pathname);

    if (onAdmin && !allow) {
      // Default behavior: bounce to public Home
      nav("/", { replace: true });
    }

    // Clear the allow flag after the first navigation so refresh defaults to Home next time
    sessionStorage.removeItem("__allowAdminReload");
  }, [nav, pathname]);

  return null;
}
