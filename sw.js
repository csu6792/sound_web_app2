const CACHE = "breeze-asr-26-v2";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./assets/sherpa-onnx-asr.js",
  "./assets/sherpa-onnx-wasm-web.js",
  "./assets/sherpa-onnx-wasm-web.wasm"
];


/* =========================================================
   Install
   ========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE)

        .then(cache => {

          return cache.addAll(
            CORE_ASSETS
          );

        })

        /*
         * 注意：
         *
         * 不在這裡 skipWaiting()
         *
         * 避免新 SW 安裝完成後
         * 立即搶走目前正在使用的頁面。
         */
    );

  }
);


/* =========================================================
   Activate
   ========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()

        .then(keys => {

          return Promise.all(

            keys
              .filter(
                key => key !== CACHE
              )

              .map(
                key =>
                  caches.delete(key)
              )

          );

        })

        /*
         * 注意：
         *
         * 不使用 clients.claim()
         *
         * 新 SW 不會在目前頁面執行期間
         * 強制接管。
         */
    );

  }
);


/* =========================================================
   Fetch
   ========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
     * 只處理 GET。
     */

    if (
      request.method !== "GET"
    ) {

      return;

    }


    const url =
      new URL(
        request.url
      );


    /*
     * 只處理 GitHub Pages 自己的資源。
     *
     * Hugging Face 模型完全不攔截。
     */

    if (
      url.origin !== location.origin
    ) {

      return;

    }


    /*
     * 不攔截 navigation。
     *
     * 這點很重要。
     *
     * index.html 由瀏覽器正常載入，
     * 避免 Service Worker 介入造成
     * 頁面重新導向 / reload。
     */

    if (
      request.mode === "navigate"
    ) {

      return;

    }


    event.respondWith(

      caches
        .match(request)

        .then(cached => {

          /*
           * Cache hit
           */

          if (
            cached
          ) {

            return cached;

          }


          /*
           * Cache miss
           */

          return fetch(
            request
          )

            .then(response => {

              if (
                !response ||
                !response.ok
              ) {

                return response;

              }


              /*
               * 複製 response。
               */

              const copy =
                response.clone();


              /*
               * 背景寫入 cache。
               *
               * 不阻塞 response。
               */

              caches
                .open(CACHE)

                .then(cache => {

                  return cache.put(
                    request,
                    copy
                  );

                })

                .catch(error => {

                  console.warn(
                    "SW cache failed:",
                    error
                  );

                });


              return response;

            });

        })

    );

  }
);
