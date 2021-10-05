export function CanvasManagerFactory(canvasEl) {
    let c = canvasEl.getContext('2d');

    // clears the screen
    function clear() {
        c.clearRect(0,0, canvasEl.width, canvasEl.height);
    }

    // draw a line 
    function line(x1, y1, x2, y2, linewidth) {
        c.lineWidth = linewidth;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.strokeStyle = "rgba(0, 0, 200, 0.8)";
        c.stroke();
    }

    // draw a circle
    function circle(x,y, radius, color) {
        c.beginPath();
        c.arc(x, y, radius, 0, Math.PI * 2);
        // c.stroke();
        c.fillStyle = color;
        c.fill();
    }  

    // draws a pin joint
    function pin(x, y, color, size) {
        moveTo()
        c.beginPath();
        c.lineTo(x, y);
        // c.stroke();
        c.fillStyle = color;
        c.fill();
        c.stroke();
    }

    // draws a roller joint 
    function roller(x, y, color, size) {
        pin(x, y, color, size);

    }


    return {
        ctx: c,
        clear: clear,
        circle: circle,
        line: line,
        roller: roller,
        pin: pin,

    }

};




let ShapeManager = function(shapes = []) {
    this.shapes = shapes;
    
    this.render = () => {
        this.shapes.forEach((shape) => {
            if (shape.drawn) {
                shape.draw();
            }
            if (shape.interactive) {
                shape.interactivity();
            }

        });
    }
}
