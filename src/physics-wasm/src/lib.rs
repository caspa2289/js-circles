extern crate wasm_bindgen;

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

struct CollisionTestResult {
    dx: f32,
    dy: f32
}

fn determine_collision(
    circle: &mut[f32],
    other_circle: &mut[f32],
    position_offset: &usize,
    radius_offset: &usize
) -> Option<CollisionTestResult> {

    let rad = circle[*radius_offset] + other_circle[*radius_offset];
    let dx = other_circle[*position_offset] - circle[*position_offset];
    let dy = other_circle[*position_offset + 1] - circle[*position_offset + 1];

    let is_colliding = dx * dx + dy * dy <= rad * rad;

    if is_colliding {
        return Some(CollisionTestResult {dx: dx, dy: dy});
    }

    return None
}

fn reflect(
    circle: &mut[f32],
    position_offset: &usize,
    velocity_offset: &usize,
    collision_x: f32,
    collision_y: f32,
) {
    let mut c_x = circle[*position_offset] - collision_x;
    let mut c_y = circle[*position_offset + 1] - collision_y;

    let c_magnitude = (c_x * c_x + c_y * c_y).sqrt();

    c_x /= c_magnitude;
    c_y /= c_magnitude;

    let dot = circle[*velocity_offset] * c_x + circle[*velocity_offset + 1] * c_y;

    if dot < 0.0 {
        c_x *= dot * 2.0;
        c_y *= dot * 2.0;

        circle[*velocity_offset] -= c_x * CIRCLE_BOUNCINESS;
        circle[*velocity_offset + 1] -= c_y * CIRCLE_BOUNCINESS;
    }
}

fn resolve_collision(
    circle: &mut[f32],
    other_circle: &mut[f32],
    dx: f32,
    dy: f32,
    position_offset: &usize,
    radius_offset: &usize,
    velocity_offset: &usize
) {
    let mut dx = dx;
    let mut dy = dy;

    let distance = (dx * dx + dy * dy).sqrt();

    let circle_x = circle[*position_offset];
    let circle_y = circle[*position_offset + 1];
    let circle_radius = circle[*radius_offset];
    let other_circle_x = other_circle[*position_offset];
    let other_circle_y = other_circle[*position_offset + 1];
    let other_circle_radius = other_circle[*radius_offset];

    let (collision_x, collision_y) = (
        (
            circle_x * other_circle_radius + other_circle_x * circle_radius
        ) / (circle_radius + other_circle_radius),
        (
            circle_y * other_circle_radius + other_circle_y * circle_radius
        ) / (circle_radius + other_circle_radius)
    );

    let step = circle_radius + other_circle_radius - distance;

    if step > 0.0 {
        dx /= distance;
        dy /= distance;

        circle[*position_offset] -= (dx * step) * 0.5;
        circle[*position_offset + 1] -= (dy * step) * 0.5;
        other_circle[*position_offset] += (dx * step) * 0.5;
        other_circle[*position_offset + 1] += (dy * step) * 0.5;
    }

    reflect(circle, position_offset, velocity_offset, collision_x, collision_y);
    reflect(other_circle, position_offset, velocity_offset, collision_x, collision_y);
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
    velocity_offset: usize,
    position_offset: usize,
) -> Vec<f32> {
    let mut i = 0;

    while i < PHYSICS_ITERATIONS_COUNT {        
        let mut x = 0;
        
        while x < js_particles.len() {
            let circle: &mut[f32] = js_particles.get_disjoint_mut([x..(x + CIRCLE_COMPONENT_COUNT)]).unwrap()[0];
            //consider 0 radius circles being empty
            if circle[radius_offset] == 0.0 {
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

            x+= CIRCLE_COMPONENT_COUNT;
        }

        let mut x = 0;
        let mut y = CIRCLE_COMPONENT_COUNT;
        while x < js_particles.len() {
            let [circle, other_circle] = 
                js_particles
                .get_disjoint_mut([
                    x..(x + CIRCLE_COMPONENT_COUNT),
                    y..(y + CIRCLE_COMPONENT_COUNT)
                ])
                .unwrap();

            let collision_data = determine_collision(
                circle,
                other_circle,
                &position_offset,
                &radius_offset
            );

            match collision_data {
                Some(data) => {
                    resolve_collision(
                        circle,
                        other_circle,
                        data.dx,
                        data.dy,
                        &position_offset,
                        &radius_offset,
                        &velocity_offset
                    )
                },
                _ => ()
            }

            if y + CIRCLE_COMPONENT_COUNT >= js_particles.len() {
                x += CIRCLE_COMPONENT_COUNT;
                y = x + CIRCLE_COMPONENT_COUNT; 
                if x + CIRCLE_COMPONENT_COUNT >= js_particles.len() {
                    x = js_particles.len();
                }
            } else {
                y+= CIRCLE_COMPONENT_COUNT;
            }
        }

        i+= 1;
    }

    return js_particles
}
