let canvas
let ctx
let savedImageData
let dragging = false // watch whether drawing stopped
let strokeColor = 'black'
let fillColor = 'black'
let line_width = 2
let polygonSides = 6
let currentTool = 'brush'
let canvasWidth = 600
let canvasHeight = 600

let usingBrush = false
let brushXPoints = new Array()
let brushYPoints = new Array()
let brushDownPos = new Array()


class ShapeBoundingBox {
    constructor (left, top, width, height) {
        this.left = left
        this.top = top
        this.width = width
        this.height = height
    }
}

class MouseDownPos {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

class Location {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

class PolygonPoint {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

// Stores top left x & y and size of rubber band box
let shapeBoundingBox = new ShapeBoundingBox(0, 0, 0, 0)
// Holds x & y position where clicked
let mousedown = new MouseDownPos(0,0)
// Holds x & y location of the mouse
let loc = new Location(0,0)

document.addEventListener('DOMContentLoaded', setupCanvas)

function setupCanvas () {
    canvas = document.getElementById('my-canvas')
    ctx = canvas.getContext('2d')
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = line_width
    canvas.addEventListener('mousedown', ReactToMouseDown)
    canvas.addEventListener('mousemove', ReactToMouseMove)
    canvas.addEventListener('mouseup', ReactToMouseUp)
}

function ChangeTool (tool) {
    document.getElementById('open').className = ''
    document.getElementById('save').className = ''
    document.getElementById('brush').className = ''
    document.getElementById('line').className = ''
    document.getElementById('rectangle').className = ''
    document.getElementById('circle').className = ''
    document.getElementById('ellipse').className = ''
    document.getElementById('polygon').className = ''
    document.getElementById(tool).className = 'selected'
    currentTool = tool
}

// Get Mouse Position
function GetMousePosition (x, y) {
    let canvasSizeData = canvas.getBoundingClientRect()
    return {
        x: (x - canvasSizeData.left) * (canvas.width / canvasSizeData.width),
        y: (y - canvasSizeData.top) * (canvas.height / canvasSizeData.height)
    }
}

// Save Canvas Image
function SaveCanvasImage () {
    savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
}

// Redraw Canvas Image
function RedrawCanvasImage () {
    // Restore image
    ctx.putImageData(savedImageData, 0, 0)
}

// Update Rubberband Size Data
function UpdateRubberbandSizeData (loc) {

    shapeBoundingBox.width = Math.abs(loc.x - mousedown.x)
    shapeBoundingBox.height = Math.abs(loc.y - mousedown.y)

    if (loc.x > mousedown.x) {
        shapeBoundingBox.left = mousedown.x
    } else {
        shapeBoundingBox.left = loc.x
    }

    if (loc.y > mousedown.y) {
        shapeBoundingBox.top = mousedown.y
    } else {
        shapeBoundingBox.top = loc.y
    }
}

// Get Angle Using X & Y position
// x = Adjacent
// y = Opposite
// Tan(angle) = Opposite / Adjacent
// Angle - ArcTan(Opposite / Adjacent)
function getAngleUsingXAndY (mouselocX, mouselocY) {
    let adjacent = mousedown.x - mouselocX
    let opposite = mousedown.y - mouselocY
    return radiansToDegrees(Math.atan2(opposite, adjacent))
}

// Radians To Degrees
function radiansToDegrees (rad) {
    if (rad < 0) {
        return (360.0 + rad * (180 / Math.PI)).toFixed(2)
    } else {
        return (rad * (180 / Math.PI)).toFixed(2)
    }
}

function getPolygonPoints () {
    let angle = degreesToRadians(getAngleUsingXAndY(loc.x, loc.y))
    let radiusX = shapeBoundingBox.width
    let radiusY = shapeBoundingBox.height
    let polygonPoints = []
    // X = mouseloc.x + radiusX * Sin(angle)
    // Y = mouseloc.y - radiusY * Cos(angle)
    for (let i = 0; i < polygonSides; i++) {
        polygonPoints.push(new PolygonPoint(loc.x + radiusX * Math.sin(angle), loc.y - radiusY * Math.cos(angle)))
        angle += 2 * Math.PI / polygonSides
    }
    return polygonPoints
}

function getPolygon () {
    let polygonPoints = getPolygonPoints()
    ctx.beginPath()
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y)
    for (let i = 1; i < polygonSides; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y)
    }
    ctx.closePath()
}

function UpdateRubberbandOnMove (loc) {
    UpdateRubberbandSizeData(loc)
    drawRubberbandShape(loc)
}

function drawRubberbandShape (loc) {
    ctx.strokeStyle = strokeColor
    ctx.fillStyle = fillColor

    if (currentTool === 'brush') {
        DrawBrush()
    } else if (currentTool === 'line') {
        ctx.beginPath()
        ctx.moveTo(mousedown.x, mousedown.y)
        ctx.lineTo(loc.x, loc.y)
        ctx.stroke()
    } else if (currentTool === 'rectangle') {
        ctx.strokeRect(shapeBoundingBox.left, shapeBoundingBox.top, shapeBoundingBox.width, shapeBoundingBox.height)
    } else if (currentTool === 'circle') {
        let radius = shapeBoundingBox.width
        ctx.beginPath()
        ctx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2)
        ctx.stroke()
    } else if (currentTool === 'ellipse') {
        let radiusX = shapeBoundingBox.width / 2
        let radiusY = shapeBoundingBox.height / 2
        ctx.beginPath()
        ctx.ellipse(mousedown.x, mousedown.y, radiusX, radiusY, Math.PI / 4, 0, Math.PI / 4)
        ctx.stroke()
    } else if (currentTool === 'polygon') {
        getPolygon()
        ctx.stroke()
    }
}

function AddBrushPoint (x, y, mousedown) {
    brushXPoints.push(x)
    brushYPoints.push(y)
    brushDownPos.push(mousedown)
}

function DrawBrush () {
    for (let i = 1; i < brushXPoints.length; i++) {
        ctx.beginPath()
        // Check if the mouse button was down at this point
        // and if so continue drawing
        if (brushDownPos[i]) {
            ctx.moveTo(brushXPoints[i - 1], brushYPoints[i - 1])
        } else {
            ctx.moveTo(brushXPoints[i] - 1, brushYPoints[i])
        }
        ctx.lineTo(brushXPoints[i], brushYPoints[i])
        ctx.closePath()
        ctx.stroke()
    }
}

// Degrees To Radians
function degreesToRadians (degrees) {
    return degrees * (Math.PI / 180)
}

// Draw Rubberband Shape

// Update Rubberband On Move

// React to Mousedown
function ReactToMouseDown (e) {
    canvas.style.cursor = 'crosshair'
    loc = GetMousePosition(e.clientX, e.clientY)
    SaveCanvasImage()
    mousedown.x = loc.x
    mousedown.y = loc.y
    dragging = true

    // handle brush
    if (currentTool === 'brush') {
        usingBrush = true
        AddBrushPoint(loc.x, loc.y)
    }
}

// React to Mousemove
function ReactToMouseMove (e) {
    canvas.style.cursor = 'crosshair'
    loc = GetMousePosition(e.clientX, e.clientY)
    // handle brush
    if (currentTool === 'brush' && dragging && usingBrush) {
        if (loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight) {
            AddBrushPoint(loc.x, loc.y, true)
        }
        RedrawCanvasImage()
        DrawBrush()
    } else {
        if (dragging) {
            RedrawCanvasImage()
            UpdateRubberbandOnMove(loc)
        }
    }
}

// React to Mouseup
function ReactToMouseUp (e) {
    canvas.style.cursor = 'default'
    loc = GetMousePosition(e.clientX, e.clientY)
    RedrawCanvasImage()
    UpdateRubberbandOnMove(loc)
    dragging = false
    usingBrush = false
}

// Saves the image in your default download directory
function SaveImage () {
    const imageFile = document.getElementById('img-file')
    imageFile.setAttribute('download', 'image.png')
    imageFile.setAttribute('href', canvas.toDataURL())
}

// Open
function OpenImage () {
    let img = new Image()
    img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
    }
    img.src = 'image.png'
}
