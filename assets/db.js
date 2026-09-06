
window.TripDB = (() => {
  let client=null, trip=null, authUser=null, member=null;

  function cfg(){ return window.SUPABASE_CONFIG || {}; }

  async function ensureAnonSession(){
    const c=cfg();
    if(!c.url || !c.key || !window.supabase) return {configured:false};
    if(!client) client=window.supabase.createClient(c.url,c.key);
    let {data:{session}}=await client.auth.getSession();
    if(!session){
      const {data,error}=await client.auth.signInAnonymously();
      if(error) throw error;
      session=data.session;
    }
    authUser=session?.user || null;
    return {configured:true};
  }

  async function init(){
    const ready=await ensureAnonSession();
    if(!ready.configured) return {configured:false,bound:false};

    const {data:t,error:te}=await client.from("trips")
      .select("id,slug,name,start_date,end_date,target_people")
      .eq("slug",cfg().tripSlug).single();
    if(te) throw te;
    trip=t;

    const {data:m,error:me}=await client.rpc("get_my_trip_member");
    if(me) throw me;
    member=Array.isArray(m)?(m[0]||null):m;
    return {configured:true,bound:!!member,trip,member};
  }

  async function loginChoices(){
    await ensureAnonSession();
    const {data,error}=await client.rpc("list_trip_members_for_login",{p_trip_slug:cfg().tripSlug});
    if(error) throw error;
    return data||[];
  }

  async function claimOrLogin(memberId,pin){
    await ensureAnonSession();
    const {data,error}=await client.rpc("claim_or_login_trip_member",{p_member_id:memberId,p_pin:String(pin)});
    if(error) throw error;
    member=Array.isArray(data)?(data[0]||null):data;
    return member;
  }

  async function requestPinReset(memberId){
    await ensureAnonSession();
    const {error}=await client.rpc("request_pin_reset",{p_member_id:memberId});
    if(error) throw error;
    return true;
  }

  async function adminResetPin(memberId){
    const {error}=await client.rpc("admin_reset_member_pin",{p_member_id:memberId});
    if(error) throw error;
    return true;
  }

  async function adminMembers(){
    const {data,error}=await client.rpc("admin_list_members");
    if(error) throw error;
    return data||[];
  }

  async function adminResetRequests(){
    const {data,error}=await client.rpc("admin_list_pin_reset_requests");
    if(error) throw error;
    return data||[];
  }

  async function forgetDevice(){
    await ensureAnonSession();
    try{ await client.rpc("forget_this_trip_device"); }catch(e){ console.warn(e); }
    await client.auth.signOut();
    location.href="login.html";
  }

  function getMember(){ return member; }
  function getTrip(){ return trip; }
  function isBound(){ return !!member; }
  function isAdmin(){ return member?.access_role==="admin"; }

  async function list(table, opts={}){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    let sel=opts.select||"*";
    if(table==="members" && sel==="*") sel="id,trip_id,name,role,joke,confirmed,sort_order,access_role";
    let q=client.from(table).select(sel);
    if(opts.trip!==false && trip?.id && ["members","categories","meal_plan","shopping_items","expenses","ideas"].includes(table)) q=q.eq("trip_id",trip.id);
    if(opts.order) q=q.order(opts.order,{ascending:opts.asc!==false});
    const {data,error}=await q;
    if(error) throw error;
    return data;
  }

  async function insert(table,row){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    if(trip?.id && ["members","categories","meal_plan","shopping_items","expenses","ideas"].includes(table) && !row.trip_id) row.trip_id=trip.id;
    const {data,error}=await client.from(table).insert(row).select().single();
    if(error) throw error;
    return data;
  }

  async function update(table,id,patch){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    const {data,error}=await client.from(table).update(patch).eq("id",id).select().single();
    if(error) throw error;
    return data;
  }

  async function remove(table,id){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    const {error}=await client.from(table).delete().eq("id",id);
    if(error) throw error;
    return true;
  }

  async function responsibilities(){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    const {data,error}=await client.from("responsibilities").select("category_id,member_id");
    if(error) throw error;
    return data||[];
  }

  async function upsertResponsibility(categoryId,memberId){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    if(!memberId){
      const {error}=await client.from("responsibilities").delete().eq("category_id",categoryId);
      if(error) throw error;
      return;
    }
    const {data,error}=await client.from("responsibilities")
      .upsert({category_id:categoryId,member_id:memberId,updated_at:new Date().toISOString()},{onConflict:"category_id"})
      .select("category_id,member_id").single();
    if(error) throw error;
    return data;
  }


  async function claimFoodItem(itemId){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    const {data,error}=await client.rpc("claim_food_item",{p_item_id:itemId});
    if(error) throw error;
    return data;
  }

  async function releaseFoodItem(itemId){
    if(!member) throw new Error("MEMBER_LOGIN_REQUIRED");
    const {data,error}=await client.rpc("release_food_item",{p_item_id:itemId});
    if(error) throw error;
    return data;
  }

  async function recentChanges(limit=12){
    if(!member) return [];
    const {data,error}=await client.from("change_log")
      .select("id,table_name,action,changed_at,member_id,members(name)")
      .order("changed_at",{ascending:false}).limit(limit);
    if(error) return [];
    return data||[];
  }

  function subscribe(table,cb){
    if(!member) return null;
    return client.channel(`trip-${table}`)
      .on("postgres_changes",{event:"*",schema:"public",table},cb).subscribe();
  }

  return {
    init,loginChoices,claimOrLogin,requestPinReset,adminResetPin,adminMembers,adminResetRequests,
    forgetDevice,getMember,getTrip,isBound,isAdmin,list,insert,update,remove,responsibilities,
    upsertResponsibility,claimFoodItem,releaseFoodItem,recentChanges,subscribe
  };
})();
