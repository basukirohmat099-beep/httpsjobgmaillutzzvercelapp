import {admin,cors,response,userFrom} from "../_shared/admin.ts";
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const user=await userFrom(req); const body=await req.json();
  if(body.task_code!=="email_sandbox_test")return response({error:"Job tidak dikenal"},400);
  // Demo task queue only: admin must supply a real sandbox test assignment before approval.
  const {data:existing}=await admin.from("job_submissions").select("id").eq("user_id",user.id).eq("task_code",body.task_code).eq("status","pending").maybeSingle();
  if(existing)return response({message:"Kamu sudah memiliki job ini yang menunggu pemeriksaan.",id:existing.id});
  const {data,error}=await admin.from("job_submissions").insert({user_id:user.id,task_code:body.task_code,task_title:"Uji alur email sandbox",status:"pending",reward_amount:4000}).select("id").single();
  if(error)throw error;
  return response({message:"Job masuk antrean. Admin perlu memberikan instruksi sandbox dan memeriksa hasilnya.",id:data.id});
 }catch(e){return response({error:e.message||"Server error"},401)}
});
