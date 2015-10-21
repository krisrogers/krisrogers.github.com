/**
 * Server singleton for rpc invocations.
 */
Server = (function () {

    // setup json rpc library
    $.jsonRPC.setup({
        endPoint: '/',
        namespace: ''
    });

    return {
        // make a promise-based json rpc request
        rpc: function (name, params) {
            return new Promise(function (resolve, reject) {
                $.jsonRPC.request(name, {
                    params: params,
                    success: function (result) {
                        resolve(result);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
        },

        selectClip: function (start, duration) {
            Server.rpc("selectclip", {
                x: start,
                width: duration
            }).then(function success (response) {
                smoke.alert('Writing composite video to <a target="_blank" href="video.html?f=' + response.result.filename + 
                    '">' + response.result.filename + "</a>");
            }, function error (response) {
                smoke.alert(response.error.message);
                console.log(response.error.data);
            });
        }
    };
})();