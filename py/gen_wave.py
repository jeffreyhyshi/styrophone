# Prints a wave in JSON-esque format
# For testing sound generation from points

import numpy as np

def gen_wave(func, steps, start_val, end_val):
    result = "["
    for x in np.linspace(start_val, end_val, num=steps):
        result = result+str(func(x))+","
    print(result[:-1]+"]")
    return result
