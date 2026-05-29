const widgetScript = String.raw`
(function () {
  var script = document.currentScript;
  if (!script) return;

  var businessId = script.getAttribute("data-leadreply-business");
  if (!businessId) return;

  var origin = new URL(script.src).origin;
  var existing = document.querySelector('[data-leadreply-widget="' + businessId + '"]');
  if (existing) return;

  var wrapper = document.createElement("div");
  wrapper.setAttribute("data-leadreply-widget", businessId);
  wrapper.style.position = "fixed";
  wrapper.style.right = "18px";
  wrapper.style.bottom = "18px";
  wrapper.style.zIndex = "2147483000";
  wrapper.style.width = "min(420px, calc(100vw - 28px))";
  wrapper.style.height = "min(620px, calc(100vh - 28px))";
  wrapper.style.borderRadius = "18px";
  wrapper.style.overflow = "hidden";
  wrapper.style.boxShadow = "0 22px 70px rgba(15, 23, 42, 0.22)";
  wrapper.style.background = "#ffffff";

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/widget/" + encodeURIComponent(businessId);
  iframe.title = "LeadReply contact widget";
  iframe.loading = "lazy";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";

  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
})();
`

export function GET() {
  return new Response(widgetScript.trim(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  })
}
