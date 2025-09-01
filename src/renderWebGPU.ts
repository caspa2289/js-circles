import {
    BUFFER_BYTE_SIZE,
    CIRCLE_COMPONENT_COUNT,
    MAX_CIRCLE_COUNT,
} from './constants'

const circleShader = `
struct Particle {
  color: vec3<f32>,
  radius: f32,
  velocity: vec2<f32>,
  pos: vec2<f32>,
}

@group(0) @binding(0) var<storage, read> data: array<Particle>;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) color : vec4<f32>          
}

@vertex
fn vertex_main(
@builtin(vertex_index) VertexIndex : u32 ,
@builtin(instance_index) InstanceIndex : u32,
) -> VertexOutput {

    let scaleBall:f32 = 0.0215 * 0.65;
    let a:f32 = 1.0 * scaleBall;
    let b:f32 = 0.71 * scaleBall;
    let c:f32 = 0.923 * scaleBall;
    let d:f32 = 0.382 * scaleBall;

    var pos = array<vec2<f32>, 6*4*2>(
        vec2( 0.0,  0.0), vec2( a, 0.0), vec2(c, d),
        vec2( 0.0,  0.0), vec2(c, d), vec2(b,  b),

        vec2( 0.0,  0.0), vec2(b,  b), vec2(d,  c),
        vec2( 0.0,  0.0), vec2(d,  c), vec2(0.0,  a),

        vec2( 0.0,  0.0), vec2( 0.0, a), vec2(-d, c),
        vec2( 0.0,  0.0), vec2(-d, c), vec2(-b, b),

        vec2( 0.0,  0.0), vec2(-b, b), vec2(-c, d),
        vec2( 0.0,  0.0), vec2(-c, d), vec2(-a,  0.0),


        vec2( 0.0,  0.0), vec2( -a, 0.0), vec2(-c, -d),
        vec2( 0.0,  0.0), vec2(-c, -d), vec2(-b, -b),

        vec2( 0.0,  0.0), vec2(-b, -b), vec2(-d, -c),
        vec2( 0.0,  0.0), vec2(-d, -c), vec2(0.0, -a),

        vec2( 0.0,  0.0), vec2(0.0, -a), vec2(d, -c),
        vec2( 0.0,  0.0), vec2(d, -c), vec2(b, -b),

        vec2( 0.0,  0.0), vec2(b, -b), vec2(c, -d),
        vec2( 0.0,  0.0), vec2(c, -d), vec2(a, 0.0),

    );

    let positionInstance = data[InstanceIndex].pos;

    var output : VertexOutput;
    let xy = pos[VertexIndex] + positionInstance;

    output.Position = vec4<f32>(xy, 0.0, 1.0);
    output.color = vec4(data[InstanceIndex].color, 1.0);

    if (data[InstanceIndex].radius == 0.0) {
        output.color.a = 0.0;
    }

    return output;
}

@fragment
    fn fragment_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
`

export const setupWebGPUContext = async (height: number, width: number) => {
    const canvas = document.createElement('canvas')
    canvas.classList.add('canvas_webgpu')
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    document.getElementById('container')?.replaceChildren(canvas)

    if (!navigator.gpu) {
        alert('browser does not support WebGPU')
        throw new Error('browser does not support WebGPU')
    }

    const adapter = await navigator.gpu.requestAdapter()

    if (!adapter) {
        alert('gpu adapter not found')
        throw new Error('gpu adapter not found')
    }

    const device = await adapter.requestDevice()

    const context = canvas.getContext('webgpu')

    if (!context) {
        alert('failed to get webgpu context')
        throw new Error('failed to get webgpu context')
    }

    const format = 'rgba8unorm'

    context.configure({
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        device,
        format,
        alphaMode: 'premultiplied',
    })

    const pipeline = device.createRenderPipeline({
        label: 'rendering pipeline',
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: circleShader,
            }),
            entryPoint: 'vertex_main',
        },
        fragment: {
            module: device.createShaderModule({
                code: circleShader,
            }),
            entryPoint: 'fragment_main',
            targets: [
                {
                    format,
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    })

    const buffer = device.createBuffer({
        label: 'particle buffer',
        size: BUFFER_BYTE_SIZE * MAX_CIRCLE_COUNT,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_DST |
            GPUBufferUsage.COPY_SRC,
    })

    const bindGroup = device.createBindGroup({
        label: 'render bindGroup',
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer } }],
    })

    return {
        pipeline,
        buffer,
        bindGroup,
        device,
        context,
    }
}

export const renderWebGPU = (
    circles: Float32Array,
    device: GPUDevice,
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    bindGroup: GPUBindGroup,
    buffer: GPUBuffer
) => {
    // console.log(circles)

    const startTime = performance.now()

    const uploadBuffer = device.createBuffer({
        label: 'particle buffer',
        size: BUFFER_BYTE_SIZE * MAX_CIRCLE_COUNT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
    })

    new Float32Array(uploadBuffer.getMappedRange()).set(circles)
    uploadBuffer.unmap()

    const encoder = device.createCommandEncoder({
        label: 'render pass encoder',
    })

    encoder.copyBufferToBuffer(uploadBuffer, 0, buffer, 0, uploadBuffer.size)

    const textureView = context.getCurrentTexture().createView()
    const renderPass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: textureView,
                clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    })

    renderPass.setPipeline(pipeline)
    renderPass.setBindGroup(0, bindGroup)
    renderPass.draw(6 * 4 * 2, circles.length / CIRCLE_COMPONENT_COUNT)
    renderPass.end()

    device.queue.submit([encoder.finish()])

    return performance.now() - startTime
}
