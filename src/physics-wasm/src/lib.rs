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
    circle: &mut Particle,
    min_height: f32,
    max_height: f32,
    min_width: f32,
    max_width: f32,
) -> BoxCollisionResult {

    BoxCollisionResult {
        x: circle.position.x - circle.radius <= min_width,
        y: circle.position.y - circle.radius <= min_height,
        x1: circle.position.x + circle.radius >= max_width,
        y1: circle.position.y + circle.radius >= max_height,
    }
}

fn handle_wall_collisions(circle: &mut Particle) {
    let collision_data: BoxCollisionResult = determine_box_collisions(circle, -1.0, 1.0, -1.0, 1.0);

    if collision_data.y1 {
        circle.position.y = 1.0 - circle.radius;
        circle.velocity.y *= -CIRCLE_BOUNCINESS;
        circle.velocity.x *= CIRCLE_BOUNCINESS;
    }

    if collision_data.y {
        circle.position.y = -1.0 + circle.radius;
        circle.velocity.y *= -CIRCLE_BOUNCINESS;
        circle.velocity.x *= CIRCLE_BOUNCINESS;
    }

    if collision_data.x1 {
        circle.position.x = 1.0 - circle.radius;
        circle.velocity.x *= -CIRCLE_BOUNCINESS;
        circle.velocity.y *= CIRCLE_BOUNCINESS;
    }

    if collision_data.x {
        circle.position.x = -1.0 + circle.radius;
        circle.velocity.x *= -CIRCLE_BOUNCINESS;
        circle.velocity.y *= CIRCLE_BOUNCINESS;
    }
}

struct CollisionTestResult {
    dx: f32,
    dy: f32
}

fn determine_collision(
    circle: &mut Particle,
    other_circle: &mut Particle,
) -> Option<CollisionTestResult> {

    let rad = circle.radius + other_circle.radius;
    let dx = other_circle.position.x - circle.position.x;
    let dy = other_circle.position.y - circle.position.y;

    let is_colliding = dx * dx + dy * dy <= rad * rad;

    if is_colliding {
        return Some(CollisionTestResult {dx: dx, dy: dy});
    }

    return None
}

fn reflect(
    circle: &mut Particle,
    collision_x: f32,
    collision_y: f32,
) {
    let mut c_x = circle.position.x - collision_x;
    let mut c_y = circle.position.y - collision_y;

    let c_magnitude = (c_x * c_x + c_y * c_y).sqrt();

    c_x /= c_magnitude;
    c_y /= c_magnitude;

    let dot = circle.velocity.x * c_x + circle.velocity.y * c_y;

    if dot < 0.0 {
        c_x *= dot * 2.0;
        c_y *= dot * 2.0;

        circle.velocity.x -= c_x * CIRCLE_BOUNCINESS;
        circle.velocity.y -= c_y * CIRCLE_BOUNCINESS;
    }
}

fn resolve_collision(
    circle: &mut Particle,
    other_circle: &mut Particle,
    dx: f32,
    dy: f32,
) {
    let mut dx = dx;
    let mut dy = dy;

    let distance = (dx * dx + dy * dy).sqrt();

    let (collision_x, collision_y) = (
        (
            circle.position.x * other_circle.radius + other_circle.position.x * circle.radius
        ) / (circle.radius + other_circle.radius),
        (
            circle.position.y * other_circle.radius + other_circle.position.y * circle.radius
        ) / (circle.radius + other_circle.radius)
    );

    let step = circle.radius + other_circle.radius - distance;

    if step > 0.0 {
        dx /= distance;
        dy /= distance;

        circle.position.x -= (dx * step) * 0.5;
        circle.position.y -= (dy * step) * 0.5;
        other_circle.position.x += (dx * step) * 0.5;
        other_circle.position.y += (dy * step) * 0.5;
    }

    reflect(circle, collision_x, collision_y);
    reflect(other_circle, collision_x, collision_y);
}

struct Vec2 {
    x: f32,
    y: f32
}

struct Particle {
    radius: f32,
    color: [f32; 3],
    velocity: Vec2,
    position: Vec2,
}

fn to_particles(
    js_particles: &Vec<f32>,
    radius_offset: &usize,
    color_offset: &usize,
    velocity_offset: &usize,
    position_offset: &usize,
) -> Vec<Particle> {
    let mut i = 0;
    let mut particles: Vec<Particle> = vec![]; //FIXME: this MIGHT be a lot faster if length is a constant

    while i < js_particles.len() {
        if js_particles[i + *radius_offset] == 0.0 {
            i+= CIRCLE_COMPONENT_COUNT;
            continue;
        }

        let particle = Particle {
            radius: js_particles[i + *radius_offset],
            color: [js_particles[i + *color_offset], js_particles[i + *color_offset + 1], js_particles[i + *color_offset + 2]],
            velocity: Vec2 { x: js_particles[i + *velocity_offset], y: js_particles[i + *velocity_offset + 1] },
            position: Vec2 { x: js_particles[i + *position_offset], y: js_particles[i + *position_offset + 1] }
        };

        particles.push(particle);
        i+= CIRCLE_COMPONENT_COUNT;
    }

    return particles;
}

fn from_particles(
    particles: Vec<Particle>,
    js_particles: &Vec<f32>,
    radius_offset: &usize,
    color_offset: &usize,
    velocity_offset: &usize,
    position_offset: &usize,
) -> Vec<f32> {
    let mut result: Vec<f32> = vec![0.0; js_particles.len()];
    
    for (index, particle) in particles.iter().enumerate() {
        let instance_index = index * CIRCLE_COMPONENT_COUNT;
        result[instance_index + *radius_offset] = particle.radius;
        result[instance_index + *color_offset] = particle.color[0];
        result[instance_index + *color_offset + 1] = particle.color[1];
        result[instance_index + *color_offset + 2] = particle.color[2];
        result[instance_index + *velocity_offset] = particle.velocity.x;
        result[instance_index + *velocity_offset + 1] = particle.velocity.y;
        result[instance_index + *position_offset] = particle.position.x;
        result[instance_index + *position_offset + 1] = particle.position.y;
    }

    return result
}

#[wasm_bindgen]
pub fn physics_tick(
    js_particles: Vec<f32>,
    radius_offset: usize,
    color_offset: usize,
    velocity_offset: usize,
    position_offset: usize,
) -> Vec<f32> {

    let mut particles = to_particles(&js_particles, &radius_offset, &color_offset, &velocity_offset, &position_offset);
    
    let mut i = 0;

    let length = particles.len();

    while i < PHYSICS_ITERATIONS_COUNT {
        let mut x = 0;
        while x < length {
            let mut z = x + 1;
            while z < length {
                let [circle, other_circle] = particles.get_disjoint_mut([x, z]).unwrap();

                if z - x == 1 {
                    circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT as f32;
                    circle.position.x += circle.velocity.x / PHYSICS_ITERATIONS_COUNT as f32;
                    circle.position.y += circle.velocity.y / PHYSICS_ITERATIONS_COUNT as f32;

                    handle_wall_collisions(circle);
                }

                let collision_data = determine_collision(
                    circle,
                    other_circle,
                );
                

                    match collision_data {
                        Some(data) => {
                            resolve_collision(
                                circle,
                                other_circle,
                                data.dx,
                                data.dy,
                            )
                        },
                        _ => ()
                    }

                z+= 1;
            }
            x += 1;
        }
        i+= 1;
    }

    return from_particles(particles, &js_particles, &radius_offset, &color_offset, &velocity_offset, &position_offset);
}
