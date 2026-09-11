// functions/tarjeta/[slug].js
import { MongoClient } from "mongodb";

export async function onRequestGet(context) {
  const { params, env } = context;
  const slug = params.slug;

  try {
    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    const db = client.db(env.MONGODB_DB);

    const tarjeta = await db.collection("tarjetas").findOne({ slug });

    await client.close();

    if (!tarjeta) {
      return new Response("Tarjeta no encontrada", { status: 404 });
    }

    return new Response(tarjeta.html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

  } catch (error) {
    return new Response("Error: " + error.message, { status: 500 });
  }
}
