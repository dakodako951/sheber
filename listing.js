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
  const editButton=document.querySelector('#pageEdit'),dialog=document.querySelector('#pageEditDialog'),form=document.querySelector('#pageEditForm'),file=document.querySelector('#pageEditFile'),preview=document.querySelector('#pageEditPreview');let initial='';
  const snapshot=()=>JSON.stringify({...Object.fromEntries(new FormData(form)),selectedFile:file.files[0]?[file.files[0].name,file.files[0].size]:null});
  const fillPage=()=>{document.title=`${listing.title} — Шебер`;document.querySelector('#pageImage').src=listing.image||'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85';document.querySelector('#pageTitle').textContent=listing.title;document.querySelector('#crumbTitle').textContent=listing.title;document.querySelector('#pageCategory').textContent=listing.category;document.querySelector('#pageCity').textContent='⌖ '+listing.city;document.querySelector('#pagePrice').textContent='от '+money(listing.price);document.querySelector('#pageDescription').textContent=listing.description;document.querySelector('#pageName').textContent=listing.name;document.querySelector('#pageAvatar').textContent=listing.name.slice(0,1).toUpperCase()};
  if(user&&listing.ownerId===user.id){editButton.hidden=false;editButton.onclick=()=>{const owned=JSON.parse(localStorage.getItem(`sheberListings_${user.id}`)||'[]').find(x=>String(x.id)===String(listing.id));if(!owned||owned.ownerId!==user.id)return toast('Нет прав для редактирования');['name','city','title','category','price','description','phone'].forEach(k=>form.elements[k].value=owned[k]??'');form.elements.removePhoto.checked=false;file.value='';preview.src=owned.image||'логитип/логотип.png';preview.hidden=false;initial=snapshot();dialog.showModal()}}
  const closeEdit=()=>{if(snapshot()!==initial&&!confirm('Изменения не сохранены. Закрыть форму?'))return;dialog.close()};document.querySelector('.page-edit-close').onclick=closeEdit;document.querySelector('.cancel-page-edit').onclick=closeEdit;dialog.addEventListener('cancel',e=>{e.preventDefault();closeEdit()});
  file.onchange=()=>{const selected=file.files[0];if(!selected)return;if(!['image/jpeg','image/png','image/webp'].includes(selected.type)||selected.size>2*1024*1024){toast('Фото должно быть JPG, PNG или WEBP до 2 МБ');file.value='';return}preview.src=URL.createObjectURL(selected);preview.hidden=false;form.elements.removePhoto.checked=false};form.elements.removePhoto.onchange=e=>preview.hidden=e.target.checked;
  const toDataUrl=f=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(f)});
  form.onsubmit=async e=>{e.preventDefault();const activeId=localStorage.getItem('sheberSession');if(!user||activeId!==user.id||listing.ownerId!==user.id){dialog.close();return toast('Нет прав для изменения объявления')}const saved=JSON.parse(localStorage.getItem(`sheberListings_${user.id}`)||'[]'),index=saved.findIndex(x=>String(x.id)===String(listing.id)&&x.ownerId===user.id);if(index<0)return toast('Объявление не найдено');const d=Object.fromEntries(new FormData(form));if(!/^\+?[\d\s()\-]{10,}$/.test(d.phone))return toast('Введите корректный номер телефона');delete d.imageFile;delete d.removePhoto;let image=saved[index].image;if(form.elements.removePhoto.checked)image='';try{if(file.files[0])image=await toDataUrl(file.files[0]);listing=saved[index]={...saved[index],...d,price:Number(d.price),image};localStorage.setItem(`sheberListings_${user.id}`,JSON.stringify(saved));sessionStorage.setItem('sheberOpenListing',JSON.stringify(listing));initial=snapshot();dialog.close();fillPage();phone.textContent='Показать телефон';toast('Изменения сохранены')}catch{toast('Не удалось сохранить изменения')}};
}
