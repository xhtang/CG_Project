// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

var glVertex = new Array(1); //
var glVertex2 = new Array(1); //为了画红色边框构建
var canvas = document.getElementById("webgl");

var gl = getWebGLContext(canvas);

// Rotation angle (degrees/second)
var ANGLE_STEP = 45.0;
var currentAngle = 0;

var flag = false; //控制动画的开关

function main() {

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Start drawing
    draw(gl);
}

function draw(gl) {
    // 转换顶点坐标，并按照三角形进行组合
    transferTriangles();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);


    //构建要渲染的三角形
    var count = 0;
    var tmpTriangle = new Array(1);
    var tmpFrame = new Array(2); //边框

    var triangle;
    var frame; //边框
    for (var j = 0; j < triangles.length; j++) {
        for (var k = 0; k < 3; k++) {
            var vertex = glVertex[triangles[j][k]];
            for (var l = 0; l < 5; l++) {
                tmpTriangle[count + l] = vertex[l];
            }
            count += 5;
        }
        triangle = new Float32Array(tmpTriangle);
        count = 0;
        drawTriangle(gl, triangle);

    }

    for (var m = 0;m < triangles.length;m++) {
        for (var n = 0;n < 3;n++) {
            var vertex2 = glVertex2[triangles[m][n]]; //边框点
            for (var o = 0;o < 5;o++) {
                tmpFrame[count + o] = vertex2[o];
            }
            count += 5;
        }
        frame = new Float32Array(tmpFrame);
        count = 0;
        drawFrame(gl, frame);
    }

}

//画一个三角形
function drawTriangle(gl, triangle) {
    var n = initVertexBuffers(gl, triangle);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

//画一个三角形边框
function drawFrame(gl, frame) {
    var n = initVertexBuffers(gl, frame);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    // Draw the rectangle
    gl.drawArrays(gl.LINE_LOOP, 0, n);
}

function initVertexBuffers(gl, triangle) {
    var verticesColors = triangle;
    var n = 3;

    // Create a buffer object
    var vertexColorBuffer = gl.createBuffer();
    if (!vertexColorBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    //Get the storage location of a_Position, assign and enable buffer
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    // Get the storage location of a_Position, assign buffer and enable


    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

// 转换顶点坐标
function transferTriangles() {

    var x, x1, y, y1; //原坐标与gl新坐标
    var r, g, b; // 颜色
    var maxX = canvasSize.maxX;
    var maxY = canvasSize.maxY;
    for (var i = 0; i < vertex_pos.length; i++) {
        var tmpVertex = new Array(1);
        x = vertex_pos[i][0];
        y = vertex_pos[i][1];

        //坐标转换
        x1 = 2 * (x - maxX / 2) / maxX;
        y1 = -2 * (y - maxY / 2) / maxY;

        r = vertex_color[i][0] / 255;
        g = vertex_color[i][1] / 255;
        b = vertex_color[i][2] / 255;
        tmpVertex[0] = x1;
        tmpVertex[1] = y1;
        tmpVertex[2] = r;
        tmpVertex[3] = g;
        tmpVertex[4] = b;
        glVertex[i] = tmpVertex;
        glVertex2[i] = [x1, y1, 1.0, 0.0, 0.0];

    }
}

//以下代码实现拖拽

//鼠标按下，将鼠标按下坐标保存在x,y中
canvas.onmousedown = function (ev) {
    var e = ev || event;
    var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    var y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    // alert([x,y]);
    drag(x, y);
};

//拖拽函数
function drag(x, y) {
    // 按下鼠标判断鼠标位置是否在圆上，当画布上有多个路径时，isPointInPath只能判断最后那一个绘制的路径

    var numOfPoint = findPoint(x, y);
    //alert(numOfPoint);

    if (numOfPoint >= 0) {
        //路径正确，鼠标移动事件
        canvas.onmousemove = function (ev) {
            var e = ev || event;
            var ax = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            var ay = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

            vertex_pos[numOfPoint][0] = ax - 10;
            vertex_pos[numOfPoint][1] = ay - 10;
            var newXY = changeCoordinate(ax -10, ay - 10, 360 - currentAngle);
            vertex_pos2[numOfPoint][0] = newXY[0];
            vertex_pos2[numOfPoint][1] = newXY[1];

            draw(gl);
        };
        //鼠标移开事件
        canvas.onmouseup = function () {
            canvas.onmousemove = null;
            canvas.onmouseup = null;
        };
    }
}

function findPoint(x, y) {
    // var flag = -1;
    for (var i = 0; i < vertex_pos.length; i++) {
        var x1 = vertex_pos[i][0] + 10;
        var y1 = vertex_pos[i][1] + 10;
        var len = Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2);
        if (len < 100)
            return i;
    }
    return -1;
}

//以下代码实现旋转

// Last time that this function was called
var g_last = Date.now();
function getNewAngle(angle) {
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}

function transferMatrix(angle) {
    var cX = canvasSize.maxX / 2;
    var cY = canvasSize.maxY / 2;
    for (var i = 0; i < vertex_pos.length; i++) {
        var x = vertex_pos2[i][0];
        var y = vertex_pos2[i][1];

        //大小变换
        var x1 = (x - cX) * ((Math.abs(angle - 180)) / 180 * 0.8 + 0.2) + cX;
        var y1 = (y - cY) * ((Math.abs(angle - 180)) / 180 * 0.8 + 0.2) + cY;

        //旋转变换
        var cos = Math.cos(angle/180 * Math.PI);
        var sin = Math.sin(angle/180 * Math.PI);

        var x2 = x1 - cX;
        var y2 = y1 - cX;

        var x3 = x2 * cos + y2 * sin + cX;
        var y3 = -x2 * sin + y2 * cos + cY;

        vertex_pos[i][0] = x3;
        vertex_pos[i][1] = y3;
    }
}

function action() {
    g_last = Date.now();
    // Start drawing
    var tick = function() {
        if (flag) {
            currentAngle = getNewAngle(currentAngle);  // Update the rotation angle
            transferMatrix(currentAngle);
            draw(gl);   // Draw the triangle
            requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
        }
    };
    tick();
}

document.onkeydown = function (ev) {
    var keyNum = window.event ? ev.keyCode :ev.which;
    if (keyNum === 84) {
        flag = !flag;
        action();
    }

};

// 这个方法是为了使的图形旋转以后，再进行拖拉时，旋转的标准坐标得到正确变化
function changeCoordinate(x, y, angle) {
    var cX = canvasSize.maxX / 2;
    var cY = canvasSize.maxY / 2;

    var x1 = (x - cX) / ((Math.abs(angle - 180)) /180 * 0.8 +0.2) +cX;
    var y1 = (y - cY) / ((Math.abs(angle - 180)) /180 * 0.8 +0.2) +cY;

    var x2 = x1 - cX;
    var y2 = y1 - cX;

    var cos = Math.cos(angle/180 * Math.PI);
    var sin = Math.sin(angle/180 * Math.PI);

    var x3 = x2 * cos + y2 * sin + cX;
    var y3 = -x2 * sin + y2 * cos + cY;

    return [x3, y3];
}