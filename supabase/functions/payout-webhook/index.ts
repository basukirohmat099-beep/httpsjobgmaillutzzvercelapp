// Configure this endpoint only after selecting a licensed payout provider.
// Verify the provider signature using its official SDK/docs before changing status.
// Never accept an unsigned webhook or trust client-supplied "paid" status.
import {admin,cors,response} from "../_shared/admin.ts";
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const secret=Deno.env.get("PAYOUT_WEBHOOK_SECRET");
 if(!secret)return response({error:"Webhook provider belum dikonfigurasi"},503);
 // Provider-specific signature verification intentionally required before implementation.
 return response({error:"Belum aktif: implementasikan verifikasi signature sesuai dokumentasi provider."},501);
});
