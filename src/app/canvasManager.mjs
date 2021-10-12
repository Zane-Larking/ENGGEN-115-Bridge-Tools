export function CanvasManagerFactory(canvasEl) {
    let c = canvasEl.getContext('2d');

    // clears the screen
    function clear() {
        c.clearRect(0,0, canvasEl.width, canvasEl.height);
    }

    // draw a line 
    function line(x1, y1, x2, y2, color, linewidth) {
        c.lineWidth = linewidth;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.strokeStyle = color;
        c.stroke();
    }

    function arrow(x, y, length, angle, color, size) {
        c.translate(x, y);
        c.rotate(-angle);

        line(0, 0, length - (size*Math.sqrt(2)/2), 0, color, size/2);
        triangleTip(length, 0, color, size)

        c.rotate(angle);
        c.translate(-x, -y);
    }

    // draw a circle
    function circle(x,y, radius, color) {
        c.beginPath();
        c.arc(x, y, radius, 0, Math.PI * 2);
        // c.stroke();
        c.fillStyle = color;
        c.fill();
    }  

    // draws a triangle that can rotate about its tip
    function triangleTip(x, y, color, size, angle) {
        c.translate(x,y);
        c.rotate(-angle);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0 - Math.sqrt(3)/2 * size, 0 + size/2);
        c.lineTo(0 - Math.sqrt(3)/2 * size, 0 - size/2);
        c.fillStyle = color;
        c.fill();
        c.rotate(angle);
        c.translate(-x, -y);
    }

    function surface(x, y, size, color, angle) {
        c.translate(x,y);
        c.rotate(-angle)
        line(size*1.5, - 1.5*size, size*1.5, 1.5*size, color, size/5);
        c.rotate(angle)
        c.translate(-x, -y)

    }

    // draws a pin joint
    function pin(x, y, color, size, angle) {
        c.translate(x,y);
        c.rotate(-angle);
        surface(0 + size * (Math.sqrt(3)/2)/1.5, 0, size, "rgb(0,0,0)", 0); 
        triangleTip(0, 0, color, size*2, Math.PI);
        c.rotate(angle);
        c.translate(-x, -y);
    }

    // draws a roller joint 
    function roller(x, y, color, size, angle) {
        
        c.translate(x,y);
        c.rotate(-angle);
        circle(0 + size *2, 0 - size * (1-Math.sqrt(3))/2, (2+Math.sqrt(3)), "rgb(120,120,120)")
        circle(0 + size *2, 0 + size * (1-Math.sqrt(3))/2, (2+Math.sqrt(3)), "rgb(120,120,120)")
        surface(0 + size, 0, size, "rgb(0,0,0)", 0); 
        triangleTip(0, 0, color, size*2, Math.PI);
        c.rotate(angle);
        c.translate(-x, -y);

    }


    return {
        ctx: c,
        clear: clear,
        circle: circle,
        line: line,
        roller: roller,
        pin: pin,
        arrow: arrow,
        triangleTip: triangleTip

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
