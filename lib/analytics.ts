import {average,type Employee} from "./model";

export type Snapshot={date:string;people:Employee[];updatedAt?:string|null};
export type DailyRow={date:string;label:string;team:number;progress:Record<string,number>;delta:Record<string,number>;kpi:Record<string,number>};
export const dateKey=(date=new Date())=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Moscow",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
export const target=(p?:Employee)=>Math.max(0.1,p?.dailyTarget||5);
export function dailyRows(snapshots:Snapshot[]):DailyRow[]{
  const sorted=[...snapshots].sort((a,b)=>a.date.localeCompare(b.date));
  return sorted.map((snapshot,index)=>{const previous=sorted[index-1];const progress:Record<string,number>={},delta:Record<string,number>={},kpi:Record<string,number>={};for(const person of snapshot.people){const now=average(person),before=previous?.people.find(p=>p.id===person.id);const gain=before?now-average(before):0;progress[person.id]=now;delta[person.id]=gain;kpi[person.id]=previous?Math.max(0,Math.round(gain/target(person)*100)):0}return{date:snapshot.date,label:new Date(`${snapshot.date}T12:00:00`).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"}),team:Math.round(snapshot.people.reduce((sum,p)=>sum+average(p),0)/Math.max(1,snapshot.people.length)),progress,delta,kpi}});
}
export function employeeMetrics(snapshots:Snapshot[],people:Employee[]){const rows=dailyRows(snapshots);return people.map(person=>{const meaningful=rows.slice(1);const contribution=meaningful.reduce((sum,row)=>sum+Math.max(0,row.delta[person.id]||0),0);const values=meaningful.map(row=>row.kpi[person.id]).filter(Number.isFinite);return{id:person.id,name:person.name.split(" ")[0],progress:average(person),contribution,kpi:values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0}})}
