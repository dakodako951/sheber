const API_BASE='/api',tokenKey='stroy_access_token',refreshKey='stroy_refresh_token';
async function api(path,options={}){const token=localStorage.getItem(tokenKey),headers={'Content-Type':'application/json',...(options.headers||{})};if(token)headers.Authorization=`Bearer ${token}`;const response=await fetch(API_BASE+path,{...options,headers}),body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.message||body.error_description||body.error||'Ошибка сервера');return body}
const mapListing=x=>({id:x.id,ownerId:x.owner_id,name:x.name,title:x.title,category:x.category,city:x.city,price:Number(x.price),description:x.description,phone:x.phone,image:x.image_url,rating:Number(x.rating),reviews:x.reviews,views:x.views,createdAt:x.created_at,pro:true});
const Backend={
  async session(){try{return await api('/auth/session')}catch{return null}},
  async listings(){return(await api('/listings')).map(mapListing)},
  async register(name,email,password){const data=await api('/auth/register',{method:'POST',body:JSON.stringify({name,email,password})});if(data.session){localStorage.setItem(tokenKey,data.session.access_token);localStorage.setItem(refreshKey,data.session.refresh_token)}return data},
  async login(email,password){const data=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem(tokenKey,data.session.access_token);localStorage.setItem(refreshKey,data.session.refresh_token);return data},
  async logout(){try{await api('/auth/logout',{method:'POST'})}finally{localStorage.removeItem(tokenKey);localStorage.removeItem(refreshKey)}},
  async updateAccount(name,password){const user=await api('/profile',{method:'PATCH',body:JSON.stringify({name,password})});return{user_metadata:{name:user.name},email:user.identifier}},
  async createListing(item){return mapListing(await api('/listings',{method:'POST',body:JSON.stringify(item)}))},
  async updateListing(id,item){return mapListing(await api(`/listings/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(item)}))},
  async deleteListing(id){await api(`/listings/${encodeURIComponent(id)}`,{method:'DELETE'})}
};globalThis.Backend=Backend;
