import {average,memberProgress,migrateProjects,type Employee,type Project} from "./model";

export type Snapshot={date:string;people:Employee[];projects?:Project[];updatedAt?:string|null};
export type DailyRow={date:string;label:string;team:number;progress:Record<string,number>;delta:Record<string,number>;kpi:Record<string,number>};
export const dateKey=(date=new Date())=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Moscow",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
export const target=(p?:Employee)=>Math.max(0.1,p?.dailyTarget||5);

export function snapshotProgress(snapshot:Snapshot,projectId="all"){
  const projects=migrateProjects(snapshot.people,snapshot.projects);
  const selected=projects.filter(p=>!p.archived&&(projectId==="all"||p.id===projectId));
  const progress:Record<string,number>={};
  for(const person of snapshot.people){
    const assignments=selected.flatMap(p=>p.members.filter(m=>m.employeeId===person.id));
    if(assignments.length){
      const weight=assignments.reduce((sum,m)=>sum+m.allocation,0);
      progress[person.id]=weight?Math.round(assignments.reduce((sum,m)=>sum+memberProgress(m)*m.allocation,0)/weight):0;
    }else if(!snapshot.projects&&projectId==="all")progress[person.id]=average(person);
  }
  return progress;
}

export function dailyRows(snapshots:Snapshot[],projectId="all"):DailyRow[]{
  const sorted=[...snapshots].sort((a,b)=>a.date.localeCompare(b.date));
  return sorted.map((snapshot,index)=>{
    const previous=sorted[index-1],progress=snapshotProgress(snapshot,projectId),before=previous?snapshotProgress(previous,projectId):{};
    const delta:Record<string,number>={},kpi:Record<string,number>={};
    for(const person of snapshot.people){
      if(progress[person.id]===undefined)continue;
      const gain=previous?progress[person.id]-(before[person.id]??progress[person.id]):0;
      delta[person.id]=gain;kpi[person.id]=previous?Math.max(0,Math.round(gain/target(person)*100)):0;
    }
    const values=Object.values(progress);
    return{date:snapshot.date,label:new Date(`${snapshot.date}T12:00:00`).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"}),team:values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0,progress,delta,kpi};
  });
}

export function employeeMetrics(snapshots:Snapshot[],people:Employee[],projects?:Project[],projectId="all"){
  const rows=dailyRows(snapshots,projectId);
  const ids=projects?new Set(migrateProjects(people,projects).filter(p=>!p.archived&&(projectId==="all"||p.id===projectId)).flatMap(p=>p.members.map(m=>m.employeeId))):new Set(Object.keys(rows.at(-1)?.progress||{}));
  return people.filter(p=>ids.has(p.id)).map(person=>{
    const meaningful=rows.slice(1),contribution=meaningful.reduce((sum,row)=>sum+Math.max(0,row.delta[person.id]||0),0),values=meaningful.map(row=>row.kpi[person.id]).filter(Number.isFinite),progress=rows.at(-1)?.progress[person.id]||0;
    return{id:person.id,name:person.name.split(" ")[0],progress,contribution,kpi:values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0};
  });
}
