var synth = (function() {
    // Singleton instance
    var instance;

    function init() {
        // Private attributes
        const WAVE_ARRAY_LEN = 50;
        const START_OCTAVE = 4;
        const A_4_PITCH = 440;

        var audioContext = new (window.AudioContext || window.webkitAudioContext);
        var fft = new FFTNayuki(WAVE_ARRAY_LEN);
        var wave = new PeriodicWave(audioContext);

        var scaleTable = initScaleTable();

        function initScaleTable() {
            result = []

            result["a"] = 1;
            result["a#"] = 1.0594630943592953;
            result["b"] = 1.122462048309373;
            result["c"] = 1.189207115002721;
            result["c#"] = 1.2599210498948732;
            result["d"] = 1.3348398541700344;
            result["d#"] = 1.4142135623730951;
            result["e"] = 1.4983070768766815;
            result["f"] = 1.5874010519681994;
            result["f#"] = 1.681792830507429;
            result["g"] = 1.7817974362806785;
            result["g#"] = 1.8877486253633868;

            return result;
        }

        function noteToFrequency(note, octave) {
            var octaveDiff = octave - START_OCTAVE;
            var octaveAPitch = A_4_PITCH * Math.pow(2, octaveDiff);
            return octaveAPitch * scaleTable[note];
        }

        return {
            // Public attributes
            startNote: function(note) {},
            stopNote: function(note) {},
            setTone: function(waveArray) {
                // TODO: Normalize?
                var real = waveArray;
                var imag = new Array(WAVE_ARRAY_LEN).fill(0)
                fft.forward(real, imag);

                real = Float32Array(real)
                imag = Float32Array(imag)
                wave = audioContext.createPeriodicWave(real, imag)
            }
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