import {admin,cors,response,userFrom} from "../_shared/admin.ts";
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const user=await userFrom(req);const b=await req.json();
  const amount=Number(b.amount),number=String(b.dana_number||"").replace(/\D/g,""),name=String(b.recipient_name||"").trim();
  if(!Number.isSafeInteger(amount)||amount<10000||amount>10000000)return response({error:"Nominal harus Rp10.000–Rp10.000.000."},400);
  if(number.length<10||number.length>15||!name||name.length>80)return response({error:"Data penerima tidak valid."},400);
  // Atomic RPC: server-side balance check + debit + withdrawal row + ledger.
  const {data,error}=await admin.rpc("create_withdrawal_request",{p_user_id:user.id,p_amount:amount,p_dana_number:number,p_recipient_name:name});
  if(error)throw error;
  return response({message:"Permintaan tercatat dan menunggu pemeriksaan admin. Dana belum dikirim.",withdrawal_id:data});
 }catch(e){return response({error:e.message||"Server error"},400)}
});
