

export function Color(r,g,b,a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}
Color.prototype.lerp = function(color1, color2, t) {
    this.r = color1.r * (1-t) + (color2.r * t);
    this.g = color1.g * (1-t) + (color2.g * t);
    this.b = color1.b * (1-t) + (color2.b * t);
    return this;
}
Color.prototype.rgba = function() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
}

Color.prototype.rgb = function() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
}


// DONE
export const Pos = function(x,y) {
    this.x = x;
    this.y = y;
    this.id = Math.random();
    // DONE
    this.dist = (other) => {
        // console.log("this: ", this);
        // console.log("other: ", other);
        return Math.hypot(this.x - other.x, this.y - other.y);
    }

    // DONE
    this.perpDistance = (A, B) => {
        //finds the perpendicular distance of this position (E) to a line defined by the points A and B 

        // vector AB
        var AB={};
        AB.x = B.x - A.x;
        AB.y = B.y - A.y;

        // vector BP
        var BE = {};
        BE.x = this.x - B.x;
        BE.y = this.y - B.y;

        // vector AP
        var AE = {};
        AE.x = this.x - A.x;
        AE.y = this.y - A.y;

        // Variables to store dot product
        var AB_BE, AB_AE;

        // Calculating the dot product
        AB_BE=(AB.x * BE.x + AB.y * BE.y);
        AB_AE=(AB.x * AE.x + AB.y * AE.y);

        // Minimum distance from
        // this point to the line segment
        var out = 0;
        
        // if the AB or BE casts down a projection (dot product) that does not fall between A and B then this point is not perpendicular to any point along AB  
        if (AB_BE > 0 || AB_AE < 0) {
            out = -1;
        }

        // 
        else {

            // Finding the perpendicular distance
            var x1 = AB.x;
            var y1 = AB.y;
            var x2 = AE.x;
            var y2 = AE.y;
            var mod = Math.sqrt(x1 * x1 + y1 * y1);
            out = Math.abs(x1 * y2 - y1 * x2) / mod;
        }   
        return out;
    }
}



// TODO
export const Vector = function(mag, dir) {
    this.dir = dir;
    this.mag = mag;
}