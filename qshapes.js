// qshapes.js
// Bryce Melegari, Joe Knox
// Created: 2017-11-20
// Updated: 2017-12-13
// Additional shapes for CS 381 Final Project
// Uses quoll.js for legacy-like primitives

// drawCircle
// draws a circle with given number of slices
function drawCircle(ctx, subdivs, r, g, b, a) {
    pushMvMatrix(ctx);
    primBegin(ctx, ctx.TRIANGLE_FAN);
    primColor(ctx, r, g, b, a);
    primNormal(ctx, 0., 0., -1.);
    primVertex(ctx, 0., 0.);
    for (var ii = 0; ii <= subdivs; ++ii) {
        primVertex(ctx,
            Math.sin(2.*Math.PI*ii/subdivs),
            Math.cos(2.*Math.PI*ii/subdivs));
    }
    primEnd(ctx);
    popMvMatrix(ctx);
}

// drawCone
// draws an open cone
function drawCone(ctx, subdivs, r, g, b, a) {
	pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, Math.PI/2., [0., 0., 1.]);
	var stepSize = 2.*Math.PI/subdivs;
	for(var ii = 0; ii < subdivs; ++ii) {
        primBegin(ctx, ctx.TRIANGLES);
        primColor(ctx, r, g, b, a);
        var point1 = vec3.fromValues(1., 0., 0.);
        var point2 = vec3.fromValues(0.,
            Math.sin(ii*2.*Math.PI/subdivs),
            Math.cos(ii*2.*Math.PI/subdivs));
        var point3 = vec3.fromValues(0.,
            Math.sin((ii+1)*2.*Math.PI/subdivs),
            Math.cos((ii+1)*2.*Math.PI/subdivs));
        // calculate facet normal
        var side1 = vec3.create();
        vec3.subtract(side1, point1, point2);
        var side2 = vec3.create();
        vec3.subtract(side2, point1, point3);
        var normal = vec3.create();
        vec3.cross(normal, side2, side1);
        vec3.normalize(normal, normal);
        primNormal(ctx, normal[0], normal[1], normal[2]);
        primVertex(ctx, point1[0], point1[1], point1[2]);
        primVertex(ctx, point2[0], point2[1], point2[2]);
        primVertex(ctx, point3[0], point3[1], point3[2]);
        primEnd(ctx);
	}
	primEnd(ctx);
	popMvMatrix(ctx);
}

// drawClosedCylinder
// draws a cylinder with closed ends
function drawClosedCylinder(ctx, subdivs, r, g, b, a) {
    pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, Math.PI/2., [0., 0., 1.]);
    // draw the open cylinder
    drawCylinder(ctx, subdivs, r, g, b, a);
    
    // draw the top circle
    pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, -Math.PI/2., [0., 1., 0.]);
    mat4.translate(ctx.mvMatrix, ctx.mvMatrix, [0., 0., -1.]);
    drawCircle(ctx, 4*subdivs, r, g, b, a);
    popMvMatrix(ctx);
    
    // draw the bottom circle
    pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, Math.PI/2., [0., 1., 0.]);
    mat4.translate(ctx.mvMatrix, ctx.mvMatrix, [0., 0., -1.]);
    drawCircle(ctx, 4*subdivs, r, g, b, a);
    popMvMatrix(ctx);
    popMvMatrix(ctx);
}

// drawRing
// draws an annulus, with radii 1 and given
function drawRing(ctx, subdivs, rad, r, g, b, a) {
    pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, Math.PI/2., [1., 0., 0.]);
    primBegin(ctx, ctx.TRIANGLE_STRIP);
    primColor(ctx, r, g, b, a);
    primNormal(ctx, 0., 0., -1.);
    for (var ii = 0; ii <= 4*subdivs; ++ii) {
        primVertex(ctx,
            Math.sin(0.5*Math.PI*ii/subdivs),
            Math.cos(0.5*Math.PI*ii/subdivs));
        primVertex(ctx,
            Math.sin(0.5*Math.PI*ii/subdivs)*rad,
            Math.cos(0.5*Math.PI*ii/subdivs)*rad);
    }
    primEnd(ctx);
    popMvMatrix(ctx);
}

// drawPipe
// draws a closed annular prism, with radii 1 and given
function drawPipe(ctx, subdivs, rad, r, g, b, a) {
    pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, Math.PI/2., [0., 0., 1.]);
    drawCylinder(ctx, subdivs, r, g, b, a);
    popMvMatrix(ctx);
    
    pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, Math.PI/2., [0., 0., 1.]);
    mat4.scale(ctx.mvMatrix, ctx.mvMatrix, [1., rad, rad]);
    drawCylinder(ctx, subdivs, r, g, b, a);
    popMvMatrix(ctx);
    
    pushMvMatrix(ctx);
    mat4.translate(ctx.mvMatrix, ctx.mvMatrix, [0., 1., 0.]);
    drawRing(ctx, subdivs, rad, r, g, b, a);
    popMvMatrix(ctx);
    
    pushMvMatrix(ctx);
    mat4.rotate(ctx.mvMatrix, ctx.mvMatrix, Math.PI, [-1., 0., 0.]);
    mat4.translate(ctx.mvMatrix, ctx.mvMatrix, [0., 1., 0.]);
    drawRing(ctx, subdivs, rad, r, g, b, a);
    popMvMatrix(ctx);
}

// drawGround function
// draws the ground and road
function drawGround() {
    // draws the grass field
    pushMvMatrix(gl);
    mat4.scale(gl.mvMatrix, gl.mvMatrix, [8., 1., 8.]);
    mat4.rotate(gl.mvMatrix, gl.mvMatrix, Math.PI/2., [1., 0., 0.]);
    drawCircle(gl, 80, 0., 0.5, 0., 1.0);
    popMvMatrix(gl);
    
    // draws the roadway
    pushMvMatrix(gl);
    mat4.translate(gl.mvMatrix, gl.mvMatrix, [0., 0.001, 0.]);
    mat4.scale(gl.mvMatrix, gl.mvMatrix, [6., 1., 6.]);
    drawRing(gl, 40, 0.5, 0.1, 0.1, 0.1, 1.0);
    popMvMatrix(gl);
    
    // draws the outer road line
    pushMvMatrix(gl);
    mat4.translate(gl.mvMatrix, gl.mvMatrix, [0., 0.002, 0.]);
    mat4.scale(gl.mvMatrix, gl.mvMatrix, [5.8, 1., 5.8]);
    drawRing(gl, 40, 0.98, 0.8, 0.8, 0.8, 1.0);
    popMvMatrix(gl);
    
    // draws the inner road line
    pushMvMatrix(gl);
    mat4.translate(gl.mvMatrix, gl.mvMatrix, [0., 0.002, 0.]);
    mat4.scale(gl.mvMatrix, gl.mvMatrix, [3.2, 1., 3.2]);
    drawRing(gl, 40, 0.98, 0.8, 0.8, 0., 1.0);
    popMvMatrix(gl);
}

// drawFountain function
// draws the fountain in the center of the roundabout
function drawFountain() {
    pushMvMatrix(gl);
    mat4.scale(gl.mvMatrix, gl.mvMatrix, [0.8, 0.1, 0.8]);
    mat4.translate(gl.mvMatrix, gl.mvMatrix, [0., 1., 0.]);
    drawClosedCylinder(gl, 40, 0.8, 0.8, 0.8, 1.0);
    mat4.scale(gl.mvMatrix, gl.mvMatrix, [1.2, 1., 1.2]);
    mat4.translate(gl.mvMatrix, gl.mvMatrix, [0., 2., 0.]);
    drawPipe(gl, 40, 0.6, 0.8, 0.8, 0.8, 1.0);
    mat4.rotate(gl.mvMatrix, gl.mvMatrix, Math.PI/2., [1., 0., 0.]);
    mat4.scale(gl.mvMatrix, gl.mvMatrix, [0.7, 0.7, 1.0]);
    drawCircle(gl, 40, 0.4, 0.4, 1.0, 1.0);
    popMvMatrix(gl);
}
