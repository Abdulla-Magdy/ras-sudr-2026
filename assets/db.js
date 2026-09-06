
window.TripDB = (() => {
  let client=null, trip=null, user=null;

  function cfg(){ return window.SUPABASE_CONFIG || {}; }

  async function init(){
    const c=cfg();
    if(!c.url || !c.key || !window.supabase) return {configured:false, authenticated:false};
    client=window.supabase.createClient(c.url,c.key);

    const {data:{session}}=await client.auth.getSession();
    user=session?.user || null;

    if(!user){
      return {configured:true, authenticated:false};
    }

    // Keep a simple public profile so edits can show a human-readable identity.
    await client.from("profiles").upsert({
      id:user.id,
      email:user.email || null,
      display_name:user.user_metadata?.full_name || user.email?.split("@")[0] || "عضو"
    }, {onConflict:"id"});

    const {data,error}=await client.from("trips").select("*").eq("slug",c.tripSlug).single();
    if(error) throw error;
    trip=data;
    return {configured:true, authenticated:true, trip, user};
  }

  async function sendMagicLink(email){
    const c=cfg();
    if(!client) client=window.supabase.createClient(c.url,c.key);
    const {error}=await client.auth.signInWithOtp({
      email,
      options:{ emailRedirectTo: c.siteUrl || window.location.origin }
    });
    if(error) throw error;
    return true;
  }

  async function signOut(){
    if(client) await client.auth.signOut();
    location.href = cfg().siteUrl || "index.html";
  }

  function getUser(){ return user; }
  function isAuthenticated(){ return !!user; }
  function tripId(){ return trip?.id || null; }

  async function list(table, opts={}){
    if(!user) return null;
    let q=client.from(table).select(opts.select||"*");
    if(opts.trip!==false && trip?.id && ["members","categories","meal_plan","shopping_items","expenses","ideas"].includes(table)) q=q.eq("trip_id",trip.id);
    if(opts.order) q=q.order(opts.order,{ascending:opts.asc!==false});
    const {data,error}=await q;
    if(error) throw error;
    return data;
  }

  async function insert(table,row){
    if(!user) throw new Error("LOGIN_REQUIRED");
    if(trip?.id && ["members","categories","meal_plan","shopping_items","expenses","ideas"].includes(table) && !row.trip_id) row.trip_id=trip.id;
    row.created_by = row.created_by || user.id;
    row.updated_by = user.id;
    const {data,error}=await client.from(table).insert(row).select().single();
    if(error) throw error;
    return data;
  }

  async function update(table,id,patch){
    if(!user) throw new Error("LOGIN_REQUIRED");
    patch.updated_by=user.id;
    const {data,error}=await client.from(table).update(patch).eq("id",id).select().single();
    if(error) throw error;
    return data;
  }

  async function remove(table,id){
    if(!user) throw new Error("LOGIN_REQUIRED");
    const {error}=await client.from(table).delete().eq("id",id);
    if(error) throw error;
    return true;
  }

  async function responsibilities(){
    if(!user) return null;
    const {data,error}=await client.from("responsibilities").select("*");
    if(error) throw error;
    return data;
  }

  async function upsertResponsibility(categoryId,memberId){
    if(!user) throw new Error("LOGIN_REQUIRED");
    if(!memberId){
      const {error}=await client.from("responsibilities").delete().eq("category_id",categoryId);
      if(error) throw error;
      return;
    }
    const {data,error}=await client.from("responsibilities")
      .upsert({
        category_id:categoryId,
        member_id:memberId,
        updated_by:user.id,
        updated_at:new Date().toISOString()
      },{onConflict:"category_id"}).select().single();
    if(error) throw error;
    return data;
  }

  async function recentChanges(limit=20){
    if(!user) return [];
    const {data,error}=await client.from("change_log")
      .select("id,table_name,record_id,action,changed_at,changed_by,profiles(display_name,email)")
      .order("changed_at",{ascending:false}).limit(limit);
    if(error) return [];
    return data || [];
  }

  function subscribe(table, callback){
    if(!user) return null;
    return client.channel(`trip-${table}`)
      .on("postgres_changes",{event:"*",schema:"public",table},callback)
      .subscribe();
  }

  return {init,sendMagicLink,signOut,getUser,isAuthenticated,tripId,list,insert,update,remove,responsibilities,upsertResponsibility,recentChanges,subscribe};
})();
