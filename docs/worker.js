
const CacheName="PWA";

self.addEventListener('install', (event) => {
	event.waitUntil((async function(){
		const cache = await caches.open(CacheName);
		await cache.addAll([
			'icons/pwa-icon-128.png',
			'icons/pwa-icon-144.png',
			'icons/pwa-icon-152.png',
			'icons/pwa-icon-192.png',
			'icons/pwa-icon-256.png',
			'icons/pwa-icon-512.png'
		].map((v)=>'/'+CacheName+'/'+v));
	})());
	self.skipWaiting();
	console.log("install completed");
});

self.addEventListener('activate', (event) => {
	event.waitUntil((async function(){ })());
});

self.addEventListener('fetch', (event) => {
	event.respondWith((async function(req){
		let res;
		try {
			res = await caches.match(req);
			if(res)
				return res;
			if(!res)
				res = await fetch(req.clone());
			if (res) {
				let cache = await caches.open(CacheName);
				await cache.put(req, res.clone());
			}
  		} catch (error) {
			res = new Response('Network error happened', {
				status: 408,
				headers: { 'Content-Type': 'text/plain' },
			});
		}
		return res;
	})(event.request));
});
