/*
 * Project: VESC Tool Config Helper
 * Version: 0.1.9
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

const CACHE_NAME = 'vesc-cache-v0.1.9';
const EXTERNAL_CACHE = 'external-cache-v0.1.9';

const urlsToCache = [
    '/vesc_config/',
    '/vesc_config/style.css',
    '/vesc_config/tooltipster/dist/css/tooltipster.bundle.min.css',
    '/vesc_config/index.js',
    '/vesc_config/cookies.js',
    '/vesc_config/tooltipster/dist/js/tooltipster.bundle.min.js',
    '/vesc_config/VESCcfg-logo-512.png',
    '/vesc_config/VESCcfg-logo-192.png'
];

// External resources to apply network-first strategy
const externalResources = [
    'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js',
    'https://cdn.jsdelivr.net/npm/acorn@8.4.1/dist/acorn.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.2.1/exceljs.min.js',
    'https://www.googletagmanager.com/gtag/js?id=G-T11KJBY66R'
];

// Install the service worker and cache local files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event handler for local and external resources
self.addEventListener('fetch', (event) => {
    if (externalResources.some(resource => event.request.url.includes(resource))) {
        // Network-first strategy for external resources
        event.respondWith(
            caches.open(EXTERNAL_CACHE).then((cache) => {
                return fetch(event.request).then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => cache.match(event.request));
            })
        );
    } else if (event.request.destination === 'image') {
        // Custom strategy for images
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        console.warn('Fetch failed; returning cached image (if available)');
                    });
                    return response || fetchPromise;
                });
            })
        );
    } else {
        // Cache-first strategy for other requests
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME, EXTERNAL_CACHE];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
