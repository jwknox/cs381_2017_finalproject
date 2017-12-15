// shadows.js
// Bryce Melegari, Joe Knox
// Created: 2017-11-20
// Updated: 2017-12-15
// Main script file for CS 381 Final Project
// Uses quoll.js for legacy-like primitives

// Globals

// WebGL General
var gl;
var depth_texture_extension;

// Shaders
var default_shaders;
var shadowmap_shaders;

// Shadowmap objects
var shadow_fbo;

// Scene
var scene_rotate_ang;
var scene_rotate_spd;
var view_ang;
var camera_view;

// Light
var light_pos;
var light_ang;
var light_rotate_spd;

// Window
var canvas_width;
var canvas_height;

// main function
// Sets up GL, shaders, callbacks, and handlers
function main(canvasid) {
    // Initialize quoll.js & WebGL
    gl = quollInit(canvasid);
    if (!gl) {
        alert('quoll.js failed to load. Exiting.');
        return;
    }
    
    // Load depth texture extension
    depth_texture_extension = gl.getExtension('WEBGL_depth_texture');
    if (!depth_texture_extension) {
        alert('WEBGL_depth_texture extension either failed to load, or is not available on this system. Exiting.');
        return;
    }

    // GL States
    gl.enable(gl.DEPTH_TEST);
    
    // Load shaders and create shader program objects
    default_shaders = makeProgramObjectFromIds(gl, 'vertex_shader', 'fragment_shader');
    if (!default_shaders) {
        alert('Loading default shaders failed. Exiting.');
        return;
    }
    default_shaders.lightpos_unif = gl.getUniformLocation(default_shaders, 'lightpos_unif');
    default_shaders.shadowmapMatrix = gl.getUniformLocation(default_shaders, 'shadowmapMatrix');
    shadowmap_shaders = makeProgramObjectFromIds(gl, 'shadowmap_vertex_shader', 'shadowmap_fragment_shader');
    if (!shadowmap_shaders) {
        alert('Loading shadowmap shaders failed. Exiting.');
        return;
    }
    
    // Initialize shadowmap framebuffer object
    shadow_fbo = createFrameBufferObject(1024, 1024);
    
    // Register callbacks with quoll.js
    registerDisplay(display);
    registerReshape(reshape);
    registerIdle(idle);
    canvasFullWindow(true);

    // Set up other event handlers
    document.addEventListener('keypress', keyboard, false);

    // Scene init
    scene_rotate_ang = 0.;
    scene_rotate_spd = 0.;
    view_ang = 25.;
    camera_view = false;
    
    // Light init
    light_pos = vec4.fromValues(0., 10., 0., 1.);
    light_ang = 0.;
    light_rotate_spd = 10.;
    
    // Window init
    canvas_width = window.innerWidth;
    canvas_height = window.innerHeight;
}

// createFrameBufferObject
// Creates a frame buffer object of given dimensions
function createFrameBufferObject(width, height) {
    var frame_buffer;
    frame_buffer = gl.createFramebuffer();
    
    // Create color buffer
    var color_buffer;
    color_buffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, color_buffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Create depth buffer
    var depth_buffer;
    depth_buffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depth_buffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Attach buffers
    gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_buffer, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depth_buffer, 0);
    
    // Reset targets
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return frame_buffer;
}

// drawScene function
// draws everything
function drawScene() {
    pushMvMatrix(gl);
    //drawGround();
    //drawFountain();
    mat4.rotate(gl.mvMatrix, gl.mvMatrix, -Math.PI/2., [1., 0., 0.]);
    drawSquare(gl, 8, 0., 0.5, 0., 1.);
    mat4.rotate(gl.mvMatrix, gl.mvMatrix, Math.PI/2., [1., 0., 0.]);
    mat4.translate(gl.mvMatrix, gl.mvMatrix, [0., 1., 0.]);
    drawCube(gl, 1, 40, 20, 0.5, 0.5, 0.3, 1.0);
    popMvMatrix(gl);
}

// display function
// shows the objects on the screen
function display() {
    // Render to texture for shadow mapping
    if (!camera_view) gl.bindFramebuffer(gl.FRAMEBUFFER, shadow_fbo);
    gl.viewport(0, 0, 1024, 1024);
    gl.clearColor(1., 1., 1., 1.);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shadowmap_shaders);
    
    // Lightview transformation
    mat4.identity(gl.mvMatrix);
    mat4.lookAt(gl.mvMatrix, light_pos, [0., 0., 0.], [0., 1., 0.]);
    mat4.identity(gl.pMatrix);
    mat4.ortho(gl.pMatrix, -10., 10., -10., 10., -10., 20.);
    var shadowmap_transform = mat4.create();
    mat4.mul(shadowmap_transform, gl.pMatrix, gl.mvMatrix);
    drawScene();
    
    // Render normally
    if (!camera_view) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas_width, canvas_height);
        gl.clearColor(0.2, 0.2, 0.2, 1.);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(default_shaders);
        gl.uniformMatrix4fv(default_shaders.shadowmapMatrix, false, shadowmap_transform);
        
        // Camera transformation
        mat4.identity(gl.mvMatrix);
        mat4.translate(gl.mvMatrix, gl.mvMatrix, [0., 0., -8.]);
        mat4.rotate(gl.mvMatrix, gl.mvMatrix, view_ang * Math.PI/180., [1., 0., 0.]);
        mat4.rotate(gl.mvMatrix, gl.mvMatrix, scene_rotate_ang * Math.PI/180., [0., -1., 0.]);
        mat4.identity(gl.pMatrix);
        mat4.perspective(gl.pMatrix, Math.PI/180. * 60., canvas_width/canvas_height, 0.1, 20.);

        // light transform
        var world_light = vec4.create();
        vec4.transformMat4(world_light, light_pos, gl.mvMatrix);
        gl.uniform4fv(default_shaders.lightpos_unif, world_light);
        drawScene();
    }
    
    gl.flush();
}

// reshape function
// Loads width and height
function reshape(width, height) {
    canvas_width = width;
    canvas_height = height;
}

// idle function
// Manages idle animation of the scene
function idle() {
    var elapsed_time = getElapsedTime(0.1);
    scene_rotate_ang += scene_rotate_spd * elapsed_time;
    light_ang += light_rotate_spd * elapsed_time;
    light_pos = vec4.fromValues(10.*Math.sin(light_ang * Math.PI/180.), 10.*Math.cos(light_ang * Math.PI/180.), 0., 1.);
    postRedisplay();
}

// keyboard function
// Takes input from the keyboard
function keyboard(event) {
    var key = keyFromEvent(event);

    switch (key) {
    // Move camera up and down
    case 'W':
    case 'w':
        //if (view_ang > 1)
            view_ang -= 1;
        postRedisplay();
        break;
    case 'S':
    case 's':
        //if (view_ang < 90)
            view_ang += 1;
        postRedisplay();
        break;

    // Adjust left-right spin speed
    case 'D':
    case 'd':
        if (scene_rotate_spd > -200) scene_rotate_spd -= 5;
        postRedisplay();
        break;
    case 'A':
    case 'a':
        if (scene_rotate_spd < 200) scene_rotate_spd += 5;
        postRedisplay();
        break;
    
    // Select camera view mode
    case 'C':
    case 'c':
        camera_view = !camera_view;
        postRedisplay();
        break;
    
    default:
        break;
    }
}