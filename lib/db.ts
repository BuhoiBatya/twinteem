import {neon} from "@neondatabase/serverless";
import {dateKey,type Snapshot} from "./analytics";

let initialized=false;
function connection(){const url=process.env.DATABASE_URL;return url?neon(url):null}
async function ensure(){
  const sql=connection();if(!sql)return null;
  if(!initialized){
    await sql`CREATE TABLE IF NOT EXISTS twinteem_state (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS twinteem_snapshots (snapshot_date date PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;
    initialized=true;
  }
  return sql;
}
export async function readState(){const sql=await ensure();if(!sql)return {configured:false,data:null,updatedAt:null};const rows=await sql`SELECT data, updated_at FROM twinteem_state WHERE id='main' LIMIT 1`;return {configured:true,data:rows[0]?.data??null,updatedAt:rows[0]?.updated_at??null}}
export async function writeState(data:{people:unknown[];version?:number}){const sql=await ensure();if(!sql)throw new Error("DATABASE_URL is not configured");const serialized=JSON.stringify(data),snapshot=JSON.stringify({people:data.people}),today=dateKey();const rows=await sql`INSERT INTO twinteem_state (id,data,updated_at) VALUES ('main',${serialized}::jsonb,now()) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data,updated_at=now() RETURNING updated_at`;await sql`INSERT INTO twinteem_snapshots (snapshot_date,data,updated_at) VALUES (${today}::date,${snapshot}::jsonb,now()) ON CONFLICT (snapshot_date) DO UPDATE SET data=EXCLUDED.data,updated_at=now()`;return rows[0]?.updated_at}
export async function readHistory(from:string,to:string){const sql=await ensure();if(!sql)return {configured:false,snapshots:[] as Snapshot[]};const rows=await sql`SELECT snapshot_date::text AS date,data,updated_at FROM twinteem_snapshots WHERE snapshot_date BETWEEN ${from}::date AND ${to}::date ORDER BY snapshot_date`;return {configured:true,snapshots:rows.map(row=>({date:row.date,people:Array.isArray(row.data?.people)?row.data.people:[],updatedAt:row.updated_at})) as Snapshot[]}}
