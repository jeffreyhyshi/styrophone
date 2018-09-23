var synth = (function() {
    // Singleton instance
    var instance;

    function init() {
        // Private attributes
        var audioContext = new (window.AudioContext || window.webkitAudioContext);

        var noteTable = initNoteTable();

        function initNoteTable() {
            
        }
        
        return {
            // Public attributes
            startTone: function(note) {},
            stopTone: function(note) {},
            setTone: function(waveArray) {}
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