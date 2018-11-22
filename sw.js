const CACHE = 'cache-v1'

const PRECACHE_URLS = [
	'./',
	'lorem.html',
	'devup-192.png',
	'devup-512.png'
]

function onInstall(evt) {
	evt.waitUntil(async function() {
		console.log('SW INSTALL')
		// Cache feltöltése
		let cache = await caches.open(CACHE)
		await cache.addAll(PRECACHE_URLS)
		self.skipWaiting()
	}())
}

function onActivate(evt) {
	evt.waitUntil(async function() {
		console.log('SW ACTIVATE')
		// Elavult cache-ek eldobása
		let cacheList = (await caches.keys()).filter(name => name !== CACHE)
		await Promise.all(cacheList.map(name => caches.delete(name)))
		await self.clients.claim()
	}())
}

function onFetch(evt) {
	// Csak a saját origin-re szóló GET kérésekkel foglalkozunk, minden másra
	// default handler
	if (evt.request.method !== 'GET' || !evt.request.url.startsWith(self.location.origin)) {
		return
	}

	evt.respondWith(async function() {
		// Először keres a cache-ben
		let res = await caches.match(evt.request)
		if (res) {
			console.log('SW CACHE', evt.request.url)
			return res
		}
		let cache = await caches.open(CACHE)
		try {
			// Ha nincs cache-ben, akkor fetch(), majd elhelyezi cache-ben
			console.log('SW FETCH', evt.request.url)
			res = await fetch(evt.request)
			await cache.put(evt.request, res.clone())
			return res
		} catch(err) {
			console.log('SW FETCH ERROR')
			return null
		}
	}())
}

self.addEventListener('install', onInstall)
self.addEventListener('activate', onActivate)
self.addEventListener('fetch', onFetch)

// vim: ts=4
