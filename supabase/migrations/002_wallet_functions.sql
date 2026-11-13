create or replace function public.create_withdrawal_request(
 p_user_id uuid,p_amount bigint,p_dana_number text,p_recipient_name text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 -- Only service_role may execute this function; Edge Function authenticates the caller first.
 if p_amount<10000 then raise exception 'Minimum withdraw Rp10.000'; end if;
 update public.wallets set available_balance=available_balance-p_amount,updated_at=now()
 where user_id=p_user_id and available_balance>=p_amount;
 if not found then raise exception 'Saldo tidak mencukupi'; end if;
 insert into public.withdrawal_requests(user_id,amount,dana_number,recipient_name)
 values(p_user_id,p_amount,p_dana_number,p_recipient_name) returning id into v_id;
 insert into public.wallet_transactions(user_id,type,amount,status,description,reference_id)
 values(p_user_id,'withdrawal',p_amount,'pending','Permintaan penarikan DANA',v_id);
 return v_id;
end $$;

create or replace function public.review_job_submission(
 p_submission_id uuid,p_decision text,p_reviewer_id uuid
) returns jsonb language plpgsql security definer set search_path=public as $$
declare j public.job_submissions%rowtype;
begin
 if not exists(select 1 from public.admins where user_id=p_reviewer_id) then raise exception 'Admin only'; end if;
 select * into j from public.job_submissions where id=p_submission_id for update;
 if not found or j.status<>'pending' then raise exception 'Job not found or already reviewed'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
 update public.job_submissions set status=p_decision,reviewer_id=p_reviewer_id,reviewed_at=now() where id=j.id;
 if p_decision='approved' then
   update public.wallets set available_balance=available_balance+4000,approved_jobs=approved_jobs+1,updated_at=now() where user_id=j.user_id;
   insert into public.wallet_transactions(user_id,type,amount,status,description,reference_id)
   values(j.user_id,'job_reward',4000,'completed','Reward job pengujian email',j.id);
 end if;
 return jsonb_build_object('submission_id',j.id,'status',p_decision);
end $$;
revoke all on function public.create_withdrawal_request(uuid,bigint,text,text) from public;
revoke all on function public.review_job_submission(uuid,text,uuid) from public;
grant execute on function public.create_withdrawal_request(uuid,bigint,text,text) to service_role;
grant execute on function public.review_job_submission(uuid,text,uuid) to service_role;
