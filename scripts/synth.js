var synth = (function() {
    // Singleton instance
    var instance;

    function init() {
        // Private attributes
        var context = new (window.AudioContext || window.webkitAudioContext);

        return {
            // Public attributes
            startTone: function() {},
            stopTone: function() {}
        }
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = init();
            }

            return instance;
        }
    }
})();