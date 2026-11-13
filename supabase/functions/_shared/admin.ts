import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
export const admin = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
export const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
export function response(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}})}
export async function userFrom(req:Request){
 const h=req.headers.get("Authorization"); if(!h) throw new Error("Unauthorized");
 const token=h.replace("Bearer ","");
 const {data,error}=await admin.auth.getUser(token);
 if(error||!data.user) throw new Error("Unauthorized");
 return data.user;
}
