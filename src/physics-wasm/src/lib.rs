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
const CIRCLE_BOUNCINESS: f32 = 0.6;

const CIRCLE_COMPONENT_COUNT: usize = 8;

struct BoxCollisionResult {
    x: bool,
    y: bool,
    x1: bool,
    y1: bool
}

fn determine_box_collisions(
    circle: &mut[f32],
    radius_offset: &usize,
    position_offset: &usize,
) -> BoxCollisionResult {

    let pos_x = &circle[*position_offset];
    let pos_y = &circle[*position_offset + 1];
    let radius = &circle[*radius_offset];

    BoxCollisionResult {
        x: pos_x + radius <= -1.0,
        y: pos_y + radius <= -1.0,
        x1: pos_x + radius >= 1.0,
        y1: pos_y + radius >= 1.0,
    }
}

fn handle_wall_collisions(
    circle: &mut[f32],
    radius_offset: &usize,
    position_offset: &usize,
    velocity_offset: &usize,
) {
    let collision_data = determine_box_collisions(circle, radius_offset, position_offset);

    if collision_data.y1 {
        circle[*position_offset + 1] = 1.0 - circle[*radius_offset];
        circle[*velocity_offset + 1] *= -CIRCLE_BOUNCINESS;
        circle[*velocity_offset] *= CIRCLE_BOUNCINESS;
    }

    if collision_data.y {
        circle[*position_offset + 1] = -1.0 - circle[*radius_offset];
        circle[*velocity_offset + 1] *= -CIRCLE_BOUNCINESS;
        circle[*velocity_offset] *= CIRCLE_BOUNCINESS;
    }

    if collision_data.x1 {
        circle[*position_offset] = 1.0 - circle[*radius_offset];
        circle[*velocity_offset] *= -CIRCLE_BOUNCINESS;
        circle[*velocity_offset + 1] *= CIRCLE_BOUNCINESS;
    }

    if collision_data.x {
        circle[*position_offset] = -1.0 - circle[*radius_offset];
        circle[*velocity_offset] *= -CIRCLE_BOUNCINESS;
        circle[*velocity_offset + 1] *= CIRCLE_BOUNCINESS;
    }
}

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

            handle_wall_collisions(
                circle,
                &radius_offset,
                &position_offset,
                &velocity_offset,
            );

            x+= 8;
        }

        i+= 1;
    }

    return js_particles
}
