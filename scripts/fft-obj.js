/* 
 * Free FFT and convolution (JavaScript)
 * 
 * Copyright (c) 2014 Project Nayuki
 * http://www.nayuki.io/page/free-small-fft-in-multiple-languages
 *
 * (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 *
 * Slightly restructured by Chris Cannam, cannam@all-day-breakfast.com
 * Restructured again to use Nayuki's arbitrary-size Bluestein code by Jeffrey Shi
 */

"use strict";

/* 
 * Construct an object for calculating the discrete Fourier transform (DFT) of size n.
 */
function FFTNayuki(n) {
    
    this.n = n;
    
    this.m = nearestPowerOf2(n);
    
    // Trignometric tables (for Bluestein)
	this.cosTable = new Array(this.n);
	this.sinTable = new Array(this.n);
	for (var i = 0; i < this.n; i++) {
		var j = i * i % (this.n * 2);  // This is more accurate than j = i * i
		this.cosTable[i] = Math.cos(Math.PI * j / this.n);
		this.sinTable[i] = Math.sin(Math.PI * j / this.n);
    }
    
    // Power of 2 trigonometric tables (for radix2)
    this.power2CosTable = new Array(this.m / 2);
    this.power2SinTable = new Array(this.m / 2);
    for (var i = 0; i < this.m / 2; i++) {
        this.power2CosTable[i] = Math.cos(2 * Math.PI * i / this.m);
        this.power2SinTable[i] = Math.sin(2 * Math.PI * i / this.m);
    }

    /* 
     * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
     * The vector's length must be equal to the size n that was passed to the object constructor, and this must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
     */
    this.forward = function(real, imag) {
        var n = this.n;

        if (real.length != imag.length || n != real.length)
            throw "Mismatched lengths";
        if (n == 0)
            return;
        else if ((n & (n - 1)) == 0)  // Is power of 2
            transformRadix2(real, imag);
        else  // More complicated algorithm for arbitrary sizes
            transformBluestein(real, imag);
    }

    var transformRadix2 = function(real, imag) {
        // Length variables
        var n = real.length;
        if (n != imag.length)
            throw "Mismatched lengths";
        if (n == 1)  // Trivial transform
            return;
        var levels = -1;
        for (var i = 0; i < 32; i++) {
            if (1 << i == n)
                levels = i;  // Equal to log2(n)
        }
        if (levels == -1)
            throw "Length is not a power of 2";
        
        // Bit-reversed addressing permutation
        for (var i = 0; i < n; i++) {
            var j = reverseBits(i, levels);
            if (j > i) {
                var temp = real[i];
                real[i] = real[j];
                real[j] = temp;
                temp = imag[i];
                imag[i] = imag[j];
                imag[j] = temp;
            }
        }
        
        // Cooley-Tukey decimation-in-time radix-2 FFT
        for (var size = 2; size <= n; size *= 2) {
            var halfsize = size / 2;
            var tablestep = n / size;
            for (var i = 0; i < n; i += size) {
                for (var j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                    var l = j + halfsize;
                    var tpre =  real[l] * this.power2CosTable[k] +
                                imag[l] * this.power2SinTable[k];
                    var tpim = -real[l] * this.power2SinTable[k] +
                                imag[l] * this.power2CosTable[k];
                    real[l] = real[j] - tpre;
                    imag[l] = imag[j] - tpim;
                    real[j] += tpre;
                    imag[j] += tpim;
                }
            }
        }
        
        // Returns the integer whose value is the reverse of the lowest 'bits' bits of the integer 'x'.
        function reverseBits(x, bits) {
            var y = 0;
            for (var i = 0; i < bits; i++) {
                y = (y << 1) | (x & 1);
                x >>>= 1;
            }
            return y;
        }
    }

    var transformBluestein = function(real, imag) {
        var n = this.n;

        // Find a power-of-2 convolution length m such that m >= n * 2 + 1
        var m = nearestPowerOf2(n);
        
        // Temporary vectors and preprocessing
        var areal = newArrayOfZeros(m);
        var aimag = newArrayOfZeros(m);
        for (var i = 0; i < n; i++) {
            areal[i] =  real[i] * this.cosTable[i] + imag[i] * this.sinTable[i];
            aimag[i] = -real[i] * this.sinTable[i] + imag[i] * this.cosTable[i];
        }
        var breal = newArrayOfZeros(m);
        var bimag = newArrayOfZeros(m);
        breal[0] = this.cosTable[0];
        bimag[0] = this.sinTable[0];
        for (var i = 1; i < n; i++) {
            breal[i] = breal[m - i] = this.cosTable[i];
            bimag[i] = bimag[m - i] = this.sinTable[i];
        }
        
        // Convolution
        var creal = new Array(m);
        var cimag = new Array(m);
        convolveComplex(areal, aimag, breal, bimag, creal, cimag);
        
        // Postprocessing
        for (var i = 0; i < n; i++) {
            real[i] =  creal[i] * this.cosTable[i] + cimag[i] * this.sinTable[i];
            imag[i] = -creal[i] * this.sinTable[i] + cimag[i] * this.cosTable[i];
        }
    }

    var convolveComplex = function (xreal, ximag, yreal, yimag, outreal, outimag) {
        var n = xreal.length;
        if (n != ximag.length || n != yreal.length || n != yimag.length
                || n != outreal.length || n != outimag.length)
            throw "Mismatched lengths";
        
        xreal = xreal.slice();
        ximag = ximag.slice();
        yreal = yreal.slice();
        yimag = yimag.slice();
        transform(xreal, ximag);
        transform(yreal, yimag);
        
        for (var i = 0; i < n; i++) {
            var temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
            ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
            xreal[i] = temp;
        }
        inverseTransform(xreal, ximag);
        
        for (var i = 0; i < n; i++) {  // Scaling (because this FFT implementation omits it)
            outreal[i] = xreal[i] / n;
            outimag[i] = ximag[i] / n;
        }
    }

    var newArrayOfZeros = function(n) {
        var result = [];
        for (var i = 0; i < n; i++)
            result.push(0);
        return result;
    }
    
    var nearestPowerOf2 = function(n) {
        var m = 1;
        while (m < n * 2 + 1)
            m *= 2;
        return m;
    }

    /* 
     * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
     * The vector's length must be equal to the size n that was passed to the object constructor, and this must be a power of 2. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
     */
    this.inverse = function(real, imag) {
	    forward(imag, real);
    }
}

