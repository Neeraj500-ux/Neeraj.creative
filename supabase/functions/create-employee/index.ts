import {createClient} from 'npm:@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async req=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});try{
const url=Deno.env.get('SUPABASE_URL')!;const anon=Deno.env.get('SUPABASE_ANON_KEY')!;const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const caller=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('Authorization')||''}}});const {data:{user}}=await caller.auth.getUser();if(!user)return reply({error:'Unauthorized'},401);
const admin=createClient(url,secret);const {data:profile}=await admin.from('profiles').select('role,active').eq('id',user.id).single();if(!profile?.active||!['admin','super_admin'].includes(profile.role))return reply({error:'Admin required'},403);
const b=await req.json();if(!b.name||!b.email||!['employee','leader','admin','super_admin'].includes(b.role))return reply({error:'Name, valid email and role required'},400);if(profile.role!=='super_admin'&&['admin','super_admin'].includes(b.role))return reply({error:'Only owner can create admins'},403);
const {data,error}=await admin.auth.admin.inviteUserByEmail(b.email,{data:{name:b.name},redirectTo:Deno.env.get('APP_URL')+'/reset-password'});if(error)throw error;const id=data.user.id;
const {error:p}=await admin.from('profiles').insert({id,name:b.name,email:b.email,role:b.role,team_id:b.department,active:true});if(p){await admin.auth.admin.deleteUser(id);throw p;}
const {error:e}=await admin.from('employees').insert({id,name:b.name,email:b.email,role:b.role,department:b.department,team_id:b.department,status:'Active',description:b.description,owner_id:user.id});if(e){await admin.auth.admin.deleteUser(id);throw e;}return reply({id,message:'Invitation sent'});
}catch(e){return reply({error:(e as Error).message},400);}});
