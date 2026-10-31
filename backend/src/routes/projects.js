import { Router } from 'express';
import db from '../db.js';
import { validateProject } from '../validation.js';
const router=Router();
router.get('/',(req,res)=>{
 const q=String(req.query.q||'').trim().toLowerCase();const tag=String(req.query.tag||'').trim().toLowerCase();
 const parseTags = value => { try { const tags=JSON.parse(value); return Array.isArray(tags) ? tags.map(String) : []; } catch { return []; } };
 const rows=db.prepare("SELECT id,title,student_name,description,tags,github_url,demo_url,status,submitted_at,reviewed_at FROM projects WHERE status='approved' ORDER BY submitted_at DESC").all().map(p=>({...p,tags:parseTags(p.tags)}));
 const projects=rows.filter(p=>(!q||`${p.title} ${p.student_name} ${p.description} ${p.tags.join(' ')}`.toLowerCase().includes(q))&&(!tag||p.tags.some(t=>t.toLowerCase()===tag)));
 const tags=[...new Set(rows.flatMap(p=>p.tags))].sort((a,b)=>a.localeCompare(b));res.json({projects,tags,total:projects.length});
});
router.post('/',(req,res)=>{
 const {errors,value}=validateProject(req.body);if(Object.keys(errors).length)return res.status(400).json({error:'Please correct the highlighted fields.',fields:errors});
 const result=db.prepare('INSERT INTO projects(title,student_name,description,tags,github_url,demo_url) VALUES(?,?,?,?,?,?)').run(value.title,value.student_name,value.description,JSON.stringify(value.tags),value.github_url,value.demo_url);
 res.status(201).json({message:'Project submitted for moderation. It will appear publicly only after approval.',project:{id:result.lastInsertRowid,...value,status:'pending'}});
});
export default router;
