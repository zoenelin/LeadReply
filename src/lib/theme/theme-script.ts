export const themeScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("leadreply-theme") || "";
    var cookieMatch = document.cookie.match(/(?:^|; )leadreply-theme=([^;]+)/);
    var cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : "";
    var saved = cookieTheme || stored || "DARK";
    var preference = saved === "LIGHT" ? "LIGHT" : "DARK";
    var resolved = preference === "DARK" ? "dark" : "light";
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.themePreference = "DARK";
  }
})();
`
