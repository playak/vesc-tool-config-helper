/*
 * Project: VESC Tool Config Helper
 * Version: 0.1.0
 * 
 * Copyright (c) 2024 Jeroen Houttuin
 * Company: SUPzero.ch, Zurich, Switzerland
 * Email: info@supzero.ch
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice, including the original 
 * attribution, shall be included in all copies or substantial portions of the Software.
 * 
 * In addition, all branding, including the logo of SUPzero.ch, may not be removed 
 * or altered in any way in any derivative work or redistribution of this Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
const CACHE_NAME = 'vesc-cache-v0.1.0';

const urlsToCache = [
    '/vesc_config/',
    '/vesc_config/style.css',
    '/vesc_config/tooltipster/dist/css/tooltipster.bundle.min.css',
    '/vesc_config/index.js',
    '/vesc_config/cookies.js',
    '/vesc_config/tooltipster/dist/js/tooltipster.bundle.min.js',
    'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js',
    'https://cdn.jsdelivr.net/npm/acorn@8.4.1/dist/acorn.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.2.1/exceljs.min.js"',
    '/vesc_config/VESCcfg-logo-512.png',
    '/vesc_config/VESCcfg-logo-192.png'
  ];

// Install the service worker and cache files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

// fetch listener to update images from time to time
self.addEventListener('fetch', (event) => {
    // Only handle requests for images (optional, based on your needs)
    if (event.request.destination === 'image') {
        event.respondWith(
            caches.open('my-cache').then((cache) => {
                return cache.match(event.request).then((response) => {
                    // Fetch the request in the background and update the cache
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());  // Cache the new response
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Handle network failure (optional)
                        console.warn('Fetch failed; returning cached image (if available)');
                    });

                    // Return the cached response if available, otherwise the network fetch
                    return response || fetchPromise;
                });
            })
        );
    }
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
