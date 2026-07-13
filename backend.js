const SUPABASE_URL='https://mqmcwdtcibbjraotnqak.supabase.co';
const SUPABASE_KEY='sb_publishable_zUA_WFSZXlemIQKKB_69Pg_6wac3fxG';
const db=globalThis.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const Backend={
  mapListing:x=>({id:x.id,ownerId:x.owner_id,name:x.name,title:x.title,category:x.category,city:x.city,price:Number(x.price),description:x.description,phone:x.phone,image:x.image_url,rating:Number(x.rating),reviews:x.reviews,views:x.views,createdAt:x.created_at,pro:true}),
  async session(){const {data}=await db.auth.getSession();return data.session},
  async listings(){const {data,error}=await db.from('listings').select('*').eq('status','active').order('created_at',{ascending:false});if(error)throw error;return data.map(Backend.mapListing)},
  async register(name,email,password){const {data,error}=await db.auth.signUp({email,password,options:{data:{name}}});if(error)throw error;return data},
  async login(email,password){const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;return data},
  async logout(){await db.auth.signOut()},
  async updateAccount(name,password){const changes={data:{name}};if(password)changes.password=password;const {data,error}=await db.auth.updateUser(changes);if(error)throw error;return data.user},
  async myListings(ownerId){const {data,error}=await db.from('listings').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false});if(error)throw error;return data.map(Backend.mapListing)},
  async createListing(item){const payload={owner_id:item.ownerId,name:item.name,title:item.title,category:item.category,city:item.city,price:item.price,description:item.description,phone:item.phone,image_url:item.image||null};const {data,error}=await db.from('listings').insert(payload).select().single();if(error)throw error;return Backend.mapListing(data)},
  async updateListing(id,changes){const payload={name:changes.name,title:changes.title,category:changes.category,city:changes.city,price:changes.price,description:changes.description,phone:changes.phone,image_url:changes.image||null,updated_at:new Date().toISOString()};const {data,error}=await db.from('listings').update(payload).eq('id',id).select().single();if(error)throw error;return Backend.mapListing(data)},
  async deleteListing(id){const {error}=await db.from('listings').delete().eq('id',id);if(error)throw error}
};
globalThis.Backend=Backend;
