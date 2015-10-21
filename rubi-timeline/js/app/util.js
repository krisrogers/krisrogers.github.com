/**
 * Utility module.
 */
util = {

    // Extract query parameter value from url.
    getUrlParameter: function getUrlParameter (sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    },

    // Format `seconds` duration as timestamp.
    formatDuration: function (seconds) {
        var hours   = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds - (hours * 3600)) / 60);
        seconds = seconds - (hours * 3600) - (minutes * 60);
        if (hours   < 10) { hours   = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        return hours + ':' + minutes + ':' + seconds;
    },

    // Register tooltip for eye movement datum.
    registerEyeTooltip: function (d) {
        new Opentip(this, "Start: <b>" + d.time.toLocaleTimeString() + "</b><br>" +
            "Duration: <b>" + util.formatDuration(EYE_BUCKET_MILLIS / 1000) + "</b><br>" +
            "Pos: <b>" + Math.round(d.pos[0] * 100) / 100 + ", " + Math.round(d.pos[1] * 100) / 100 + "</b><br>" +
            "Delta: <b>" + Math.round(100 * (d.pos[0] - (d.prev ? d.prev.pos[0] : 0))) / 100 + ", " +
                Math.round(100 * (d.pos[1] - (d.prev ? d.prev.pos[1] : 0))) / 100 + "</b><br>");
    },

    // Register tooltip for specified speech segment.
    registerSpeechTooltip: function (d) {
        new Opentip(this, "<b>" + d.label + "</b>" +
            "</b><br>Start: <b>" + d.start.toLocaleTimeString() +
            "</b><br>End: <b>" + d.end.toLocaleTimeString() + "</b>" +
            "</b><br>Duration: <b>" + util.formatDuration((d.end - d.start) / 1000) + "</b>");
    },

    // Register tooltip for specified video stream.
    registerStreamTooltip: function (d) {
        new Opentip(this, "<b>" + d.folder + "</b>" +
            "</b><br>Start: <b>" + d.start_time.toLocaleTimeString() +
            "</b><br>End: <b>" + d.end_time.toLocaleTimeString() + "</b>" +
            "<br>Files: <b>" + d.files.length + "</b>");
    }
};