const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₸';
const toast=message=>{const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2500)};
const read=(key,fallback=[])=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let listing;
try{listing=JSON.parse(sessionStorage.getItem('sheberOpenListing'))}catch{}
const requestedId=new URLSearchParams(location.search).get('id');
const users=read('sheberUsers');
const savedListings=users.flatMap(user=>read(`sheberListings_${user.id}`));
if(!listing||String(listing.id)!==String(requestedId))listing=[...savedListings,...(globalThis.SHEBER_LISTINGS||[])].find(item=>String(item.id)===String(requestedId));
if(!listing){document.querySelector('#listingMissing').hidden=false}else{
  document.querySelector('#listingMain').hidden=false;
  document.title=`${listing.title} — Шебер`;
  document.querySelector('#pageImage').src=listing.image||'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85';
  document.querySelector('#pageTitle').textContent=listing.title;
  document.querySelector('#crumbTitle').textContent=listing.title;
  document.querySelector('#pageCategory').textContent=listing.category;
  document.querySelector('#pageCity').textContent='⌖ '+listing.city;
  document.querySelector('#pagePrice').textContent='от '+money(listing.price);
  document.querySelector('#pageDescription').textContent=listing.description;
  document.querySelector('#pageName').textContent=listing.name;
  document.querySelector('#pageAvatar').textContent=listing.name.slice(0,1).toUpperCase();
  document.querySelector('#pageRating').textContent=`★ ${listing.rating} · ${listing.reviews} отзывов`;
  const phone=document.querySelector('#pagePhone');phone.onclick=()=>phone.textContent=listing.phone;
  const sessionId=localStorage.getItem('sheberSession'),user=users.find(x=>x.id===sessionId),fav=document.querySelector('#pageFavorite');
  const key=user?`sheberFavorites_${user.id}`:null;let favorites=new Set(key?read(key):[]);
  const updateFavorite=()=>{fav.classList.toggle('saved',favorites.has(listing.id));fav.textContent=favorites.has(listing.id)?'♥ В избранном':'♡ Добавить в избранное'};updateFavorite();
  fav.onclick=()=>{if(!user){toast('Войдите в аккаунт на странице каталога');return}favorites.has(listing.id)?favorites.delete(listing.id):favorites.add(listing.id);localStorage.setItem(key,JSON.stringify([...favorites]));updateFavorite()};
}
