// functions/api/negocios.js
import { MongoClient } from "mongodb";

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    const db = client.db(env.MONGODB_DB);

    const negocios = await db.collection("negocios")
      .find({ activo: true })
      .sort({ fechaPublicacion: -1 })
      .toArray();

    await client.close();

    return new Response(JSON.stringify({ ok: true, negocios }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
