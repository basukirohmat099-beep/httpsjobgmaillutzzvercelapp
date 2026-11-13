import {admin,cors,response,userFrom} from "../_shared/admin.ts";
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const reviewer=await userFrom(req);
  const {data:adm}=await admin.from("admins").select("user_id").eq("user_id",reviewer.id).maybeSingle();
  if(!adm)return response({error:"Admin only"},403);
  const {submission_id,decision}=await req.json();
  if(!submission_id||!["approved","rejected"].includes(decision))return response({error:"Invalid request"},400);
  const {data,error}=await admin.rpc("review_job_submission",{p_submission_id:submission_id,p_decision:decision,p_reviewer_id:reviewer.id});
  if(error)throw error;
  return response({message:"Review tersimpan.",result:data});
 }catch(e){return response({error:e.message||"Server error"},400)}
});
