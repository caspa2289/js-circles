extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

const PHYSICS_ITERATIONS_COUNT: i32 = 5;
const GRAVITY_CONST: f32 = -0.5 / 500.0;
const CIRCLE_BOUNCINESS: f32 = 0.6;
const GRID_SIZE: f32 = 3.0 / 400.0 * 2.0 * 2.6755;

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

struct GridCell<'a> {
    x: f32,
    y: f32,
    x1: f32,
    y1: f32,
    items: Vec<&'a mut Particle>,
    relevant_cells: Vec<usize>,
}

fn get_spatial_grid(circles: &mut Vec<Particle>) -> Vec<GridCell<'_>> {

    let mut grid: Vec<GridCell> = vec![];
    let grid_dimension = (2.0 / GRID_SIZE).trunc() as usize;
    let cell_size: f32 = 2.0 / grid_dimension as f32;

    let mut i = 0;

    while i < grid_dimension {
        let mut x = 0;
        while x < grid_dimension {
            
            let mut relevant_cells: Vec<usize> = vec![];

            let cell_index = i * grid_dimension + x;

            if cell_index % grid_dimension == 0 {
                //cell is first in a row
                if cell_index == 0 {
                    //cell is first in first row
                    relevant_cells = vec![1, grid_dimension, grid_dimension + 1];
                } else if cell_index + grid_dimension == grid_dimension * grid_dimension {
                    //cell is first in last row
                    relevant_cells = vec![
                        cell_index - grid_dimension,
                        cell_index - grid_dimension + 1,
                        cell_index + 1,
                    ]
                } else {
                    relevant_cells = vec![
                        cell_index - grid_dimension,
                        cell_index - grid_dimension + 1,
                        cell_index + 1,
                        cell_index + grid_dimension,
                        cell_index + grid_dimension + 1,
                    ]
                }
             } else if (cell_index + 1) % grid_dimension == 0 {
                //cell is last in a row
                if cell_index == grid_dimension - 1 {
                    //cell is last in first row
                    relevant_cells = vec![
                        grid_dimension - 2,
                        grid_dimension * 2 - 2,
                        grid_dimension * 2 - 1,
                    ]
                } else if cell_index == grid_dimension * grid_dimension - 1 {
                    //cell is last in last row
                    relevant_cells = vec![
                        cell_index - grid_dimension - 1,
                        cell_index - grid_dimension,
                        cell_index - 1,
                    ]
                } else {
                    relevant_cells = vec![
                        cell_index - grid_dimension - 1,
                        cell_index - grid_dimension,
                        cell_index - 1,
                        cell_index + grid_dimension - 1,
                        cell_index + grid_dimension,
                    ]
                }
            } else if (cell_index as i32) - (grid_dimension as i32) < 0 {
                //cell is in first row
                relevant_cells = vec![
                    cell_index - 1,
                    cell_index + 1,
                    cell_index + grid_dimension - 1,
                    cell_index + grid_dimension,
                    cell_index + grid_dimension + 1,
                ]
            } else if cell_index + grid_dimension >= grid_dimension * grid_dimension {
                //cell is in last row
                relevant_cells = vec![
                    cell_index - grid_dimension - 1,
                    cell_index - grid_dimension,
                    cell_index - grid_dimension + 1,
                    cell_index - 1,
                    cell_index + 1,
                ]
            } else {
                //cell is not on any of the edges
                relevant_cells = vec![
                    cell_index - grid_dimension - 1,
                    cell_index - grid_dimension,
                    cell_index - grid_dimension + 1,
                    cell_index - 1,
                    cell_index + 1,
                    cell_index + grid_dimension - 1,
                    cell_index + grid_dimension,
                    cell_index + grid_dimension + 1,
                ]
            }

            grid.push(
                GridCell {
                    x: x as f32 * cell_size,
                    y: i as f32 * cell_size,
                    x1: x as f32 * cell_size + cell_size,
                    y1: i as f32 * cell_size + cell_size,
                    items: vec![],
                    relevant_cells: relevant_cells
                }
            );

            x+= 1;
        }
        i+= 1;
    }

    for circle in circles.iter_mut() {
        //FIXME: the bug is definitely here, something wrong with negative positions i guess
        let grid_y = (circle.position.y / cell_size).floor() as usize;
        let grid_x = (circle.position.x / cell_size).floor() as usize;

        let grid_cell_index = grid_y * grid_dimension + grid_x;
        grid[grid_cell_index].items.push(circle);
    }

    return grid

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
        for circle in particles.iter_mut() {
            circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT as f32;
            circle.position.x += circle.velocity.x / PHYSICS_ITERATIONS_COUNT as f32;
            circle.position.y += circle.velocity.y / PHYSICS_ITERATIONS_COUNT as f32;

            handle_wall_collisions(circle);
        }

        let mut grid = get_spatial_grid(&mut particles);

        let mut x = 0;
        while x < grid.len() {
            let mut y = 0;
            while y < grid[x].items.len() {
                let mut z = 1;
                while z < grid[x].items.len() {
                    if y <= z {
                        z+= 1;
                        continue;
                    }

                    let [
                        circle,
                        other_circle
                    ] = grid[x].items.get_disjoint_mut([y, z]).unwrap();

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
                
                y += 1; 
            }

            x+= 1;
        }
        
        //         //skip adjacent cells check if circle is fully contined within own cell
        //         //in best case gets a 20% speed up, worst case - nothing
        //         if (xCollision || yCollision || x1Collision || y1Collision) {
        //             for (let v = 0; v < cell.relevantCells.length; v++) {
        //                 const relevantCell = grid[cell.relevantCells[v]]
        //                 for (let z = 0; z < relevantCell.items.length; z++) {
        //                     const otherCircle = relevantCell.items[z]
        //                     const collisionData = determineCollision(
        //                         circle,
        //                         otherCircle
        //                     )
        //                     if (collisionData) {
        //                         resolveCollision(
        //                             circle,
        //                             otherCircle,
        //                             collisionData.dx,
        //                             collisionData.dy
        //                         )
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
        i+= 1;
    }

    return from_particles(particles, &js_particles, &radius_offset, &color_offset, &velocity_offset, &position_offset);
}
