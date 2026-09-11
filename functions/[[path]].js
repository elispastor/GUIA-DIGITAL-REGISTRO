// functions/[[path]].js
// Sirve el index.html para cualquier ruta

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Si es la raíz, servir el index.html
  if (url.pathname === "/" || url.pathname === "") {
    const html = await env.ASSETS.fetch(new URL("/index.html", request.url));
    return new Response(html.body, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // Para otras rutas, dejar que Cloudflare maneje
  return env.ASSETS.fetch(request);
}
