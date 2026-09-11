// functions/registro.js
import { MongoClient } from "mongodb";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    
    const nombre = formData.get("nombre");
    const negocio = formData.get("negocio");
    const telefono = formData.get("telefono");
    const email = formData.get("email") || "";
    const plan = formData.get("plan");
    const tipo = formData.get("tipo");
    const descripcion = formData.get("descripcion");
    const whatsapp = formData.get("whatsapp") || telefono;
    const direccion = formData.get("direccion") || "";
    
    const logoFile = formData.get("logo");
    const foto1File = formData.get("foto1");
    const foto2File = formData.get("foto2");
    
    const logoBase64 = logoFile ? await fileToBase64(logoFile) : "";
    const foto1Base64 = foto1File ? await fileToBase64(foto1File) : "";
    const foto2Base64 = foto2File ? await fileToBase64(foto2File) : "";

    const slug = generarSlug(negocio);

    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    const db = client.db(env.MONGODB_DB);

    const afiliado = {
      nombre, negocio, telefono, email, whatsapp, direccion,
      plan, tipo, descripcion,
      logo: logoBase64, foto1: foto1Base64, foto2: foto2Base64,
      slug,
      fechaRegistro: new Date(),
      estado: "activo"
    };

    const resultAfiliado = await db.collection("afiliados").insertOne(afiliado);
    const afiliadoId = resultAfiliado.insertedId;

    const htmlTarjeta = generarHTMLTarjeta(afiliado);

    await db.collection("tarjetas").insertOne({
      afiliado_id: afiliadoId,
      slug,
      html: htmlTarjeta,
      url: `${env.BASE_URL}/tarjeta/${slug}`,
      creada: new Date()
    });

    await db.collection("negocios").insertOne({
      afiliado_id: afiliadoId,
      nombre, negocio, slug, plan, tipo, descripcion,
      logo: logoBase64,
      telefono, whatsapp,
      url: `${env.BASE_URL}/tarjeta/${slug}`,
      fechaPublicacion: new Date(),
      activo: true
    });

    await client.close();

    return new Response(JSON.stringify({
      ok: true,
      mensaje: "¡Registro exitoso! Tu tarjeta ya está publicada.",
      url: `${env.BASE_URL}/tarjeta/${slug}`,
      slug
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${file.type};base64,${btoa(binary)}`;
}

function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

function generarHTMLTarjeta(a) {
  const planNombre = {
    basico: "Básico", pro: "Pro", elite: "Élite", eliteplus: "Élite Plus"
  }[a.plan] || "Básico";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${a.negocio} — Guía Digital Cúcuta</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#0b1c3a,#1e3a8a);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .tarjeta{background:white;border-radius:24px;max-width:480px;width:100%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
  .header{background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:30px;text-align:center}
  .logo{width:120px;height:120px;border-radius:50%;object-fit:cover;border:5px solid white;margin-bottom:15px}
  .negocio{font-size:1.6rem;font-weight:bold;color:#0b1c3a}
  .plan{display:inline-block;background:#0b1c3a;color:#fbbf24;padding:5px 15px;border-radius:20px;font-size:0.85rem;font-weight:bold;margin-top:10px}
  .body{padding:30px}
  .descripcion{color:#555;line-height:1.6;margin-bottom:20px;text-align:center}
  .info{background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:20px}
  .info p{margin:8px 0;color:#333;font-size:0.95rem}
  .info strong{color:#0b1c3a}
  .botones{display:flex;gap:10px;flex-wrap:wrap}
  .btn{flex:1;min-width:140px;padding:14px;border-radius:50px;text-align:center;text-decoration:none;font-weight:bold;transition:transform 0.2s}
  .btn:hover{transform:scale(1.03)}
  .btn-wa{background:#25d366;color:white}
  .btn-tel{background:#0b1c3a;color:white}
  .fotos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
  .fotos img{width:100%;height:120px;object-fit:cover;border-radius:12px}
  .footer{text-align:center;padding:15px;background:#0b1c3a;color:#fbbf24;font-size:0.8rem}
</style>
</head>
<body>
<div class="tarjeta">
  <div class="header">
    ${a.logo ? `<img src="${a.logo}" alt="${a.negocio}" class="logo">` : ""}
    <div class="negocio">${a.negocio}</div>
    <div class="plan">Plan ${planNombre}</div>
  </div>
  <div class="body">
    <p class="descripcion">${a.descripcion}</p>
    ${a.foto1 || a.foto2 ? `
    <div class="fotos">
      ${a.foto1 ? `<img src="${a.foto1}" alt="Foto 1">` : ""}
      ${a.foto2 ? `<img src="${a.foto2}" alt="Foto 2">` : ""}
    </div>` : ""}
    <div class="info">
      <p><strong>📍 Dirección:</strong> ${a.direccion || "Cúcuta, Colombia"}</p>
      <p><strong>📞 Teléfono:</strong> ${a.telefono}</p>
      <p><strong>👤 Contacto:</strong> ${a.nombre}</p>
    </div>
    <div class="botones">
      <a href="https://wa.me/57${a.whatsapp.replace(/\D/g, "")}" class="btn btn-wa" target="_blank">💬 WhatsApp</a>
      <a href="tel:${a.telefono}" class="btn btn-tel">📞 Llamar</a>
    </div>
  </div>
  <div class="footer">Guía Digital Cúcuta — NGE</div>
</div>
</body>
</html>`;
}
