extern crate serde_json;
extern crate wasm_bindgen;
extern crate serde_wasm_bindgen;
use serde::{Serialize, Deserialize};

use wasm_bindgen::prelude::*;


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

const PHYSICS_ITERATIONS_COUNT: i32 = 5;
const GRAVITY_CONST: f32 = -0.5 / 500.0;

const CIRCLE_COMPONENT_COUNT: usize = 8;

//data layout
// struct Particle {
//   color: vec3<f32>,
//   radius: f32,
//   velocity: vec2<f32>,
//   pos: vec2<f32>,
// }

#[wasm_bindgen]
pub fn physics_tick(
    mut js_particles: Vec<f32>,
    width: f64,
    height: f64,
    grid_dimension: f64,
    radius_offset: usize,
    color_offset: usize,
    velocity_offset: usize,
    position_offset: usize,
) -> Vec<f32> {

    let mut i = 0;

    while i < PHYSICS_ITERATIONS_COUNT {        
        let mut x = 0;
        while x < js_particles.len() {
            let circle: &mut[f32] = js_particles.get_disjoint_mut([x..(x + CIRCLE_COMPONENT_COUNT)]).unwrap()[0];
            //consider 0 radius circles being empty
            if (circle[radius_offset] == 0.0) {
                x+= 8;
                continue;
            }

            circle[velocity_offset + 1] += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT as f32;
            circle[position_offset] += circle[velocity_offset] / PHYSICS_ITERATIONS_COUNT as f32;
            circle[position_offset + 1] += circle[velocity_offset + 1] / PHYSICS_ITERATIONS_COUNT as f32;

            // handleWallCollisions(circle, maxWidth, maxHeight)

            x+= 8;
        }

        i+= 1;
    }

    return js_particles
}
