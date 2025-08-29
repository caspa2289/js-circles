extern crate serde_json;
extern crate wasm_bindgen;
extern crate serde_wasm_bindgen;
use serde::{Serialize, Deserialize};

use wasm_bindgen::prelude::*;


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[derive(Serialize, Deserialize)]
pub struct Vec2 {
    x: f64,
    y: f64
}

#[derive(Serialize, Deserialize)]
pub struct Particle {
    index: i64,
    radius: f64,
    velocity: Vec2,
    color: [f64; 3],
    position: Vec2,
}

const PHYSICS_ITERATIONS_COUNT: i32 = 5;

#[wasm_bindgen]
pub fn physics_tick(
    js_particles: JsValue,
    width: f64,
    height: f64,
    grid_dimension: f64
) -> Result<JsValue, JsValue> {

    let particles: Vec<Particle> = serde_wasm_bindgen::from_value(js_particles)?;

    let mut i = 0;

    while i < PHYSICS_ITERATIONS_COUNT {
        println!("hello");
        
        i+= 1;
    }

    Ok(serde_wasm_bindgen::to_value(&particles)?)
}
