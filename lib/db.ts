import {neon} from "@neondatabase/serverless";

let initialized=false;
function connection(){const url=process.env.DATABASE_URL;return url?neon(url):null}
async function ensure(){
  const sql=connection();if(!sql)return null;
  if(!initialized){await sql`CREATE TABLE IF NOT EXISTS twinteem_state (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;initialized=true}
  return sql;
}
export async function readState(){const sql=await ensure();if(!sql)return {configured:false,data:null,updatedAt:null};const rows=await sql`SELECT data, updated_at FROM twinteem_state WHERE id='main' LIMIT 1`;return {configured:true,data:rows[0]?.data??null,updatedAt:rows[0]?.updated_at??null}}
export async function writeState(data:unknown){const sql=await ensure();if(!sql)throw new Error("DATABASE_URL is not configured");const serialized=JSON.stringify(data);const rows=await sql`INSERT INTO twinteem_state (id,data,updated_at) VALUES ('main',${serialized}::jsonb,now()) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data,updated_at=now() RETURNING updated_at`;return rows[0]?.updated_at}
