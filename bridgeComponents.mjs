// import canvasManagerFactory from './canvasManager.mjs';

function isIterable(input) {  
    if (input === null || input === undefined) {
        return false;
    }

    return typeof input[Symbol.iterator] === 'function';
}

// DONE
compressiveStrength = (stiffnessFactor) => {
    // Critical Buckling constant = pi^2 x E x I
    // where, E = 10, and I = 6 mm^4
    const constant = 10 * Math.PI**2 * 6;
    let formula = (length, safetyFactor) => {
        (contant / length**2) * stiffnessFactor * safetyFactor;
    }
    return formula;
}

// DONE
tensionStrength = (stiffnessFactor) => {
    // single capacity for aparata pine is 230 N
    let formula = (singleCapacity, safetyFactor) => {
        singleCapacity * stiffnessFactor * safetyFactor;
    }
    return formula;
}

// DONE
memberTypes = [
    {name: "type 1", cost: {short: 2200, long: 5250}, size: 1, tension: tensionStrength(1), compression: compressiveStrength(1)},
    {name: "type 2", cost: {short: 6600, long: 15750}, size: 2, tension: tensionStrength(2.28), compression: compressiveStrength(8)},
    {name: "type 3", cost: {short: 9900, long: 23620}, size: 3, tension: tensionStrength(3.6), compression: compressiveStrength(27)},
    {name: "type 4", cost: {short: 8250, long: 19680}, size: 2, tension: tensionStrength(2), compression: compressiveStrength(26)},
    {name: "type 5", cost: {short: 11000, long: 26000}, size: 2, tension: tensionStrength(2), compression: compressiveStrength(56)}
]

// DONE
const Pos = function(x,y) {
    this.x = x;
    this.y = y;

    // DONE
    this.dist = (other) => {
        Math.hypot(this.x - other.x, this.y - other.y);
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

const Vector = function(mag, dir) {
    this.dir = dir;
    this.mag = mag;
}

const ExternalForce = function(joint, mag, dir) {
    
}

const Pin = function(joint) {
    this.joint = joint;
    this.horizontal = new Vector(0, 0);
    this.vertical = new Vector(0, 90);
}

// TODO
const Joint = function(bridge, pos) {
    this.bridge = bridge;
    this.pos = pos;

    this.neighbours = new Set();
    this.members = new Set();
    this.radius = 50;

    // DONE
    this.addNeighbour = (joint) => {
        if (this == joint) {
            return;
        }
        // makes each joint a neighbour of the other
        this.neighbours.add(joint);
        joint.neighbours.add(this);
        // adds a member between the joints
        let member = new Member(this.bridge, new Set([this, joint]));
        this.members.add(member);
        // adds a reference in parent bridge
        this.bridge.members.add(member);
    } 

    // DONE
    this.removeNeighbour = (joint) => {
        this.neighbours.delete(joint);
        joint.neighbours.delete(this);
    }
    
    // ! Decremented
    // this.from = (arg) => {
    //     // if arg is a Joint
    //     if (arg.constructor == Joint) {
    //         return arg;
    //     }
    //     // if arg is a Pos
    //     else if (arg.constructor == Pos) {
    //         return new Joint(arg);
    //     }
    //     else if (isIterable(arg)) {

    //     }
    //     else {
    //         console.log("Attention: Joint parameter is invalid");
    //     }
    // }
    
    // DONE
    this.remove = () => {
        // deletes the joint and all members attatched to it    

        // removes references to joint from the parent bridge
        this.bridge.joints.delete(this);
        this.bridge.selected.joints.delete(this);
        

        // rebases any members connected to the joint
        this.members.forEach((member) => {
            // gets reference to the members other joint
            let other = member.other(this);

            // removes this joint from the members reference
            member.joints.delete(this);

            // adds a replacement joint
            let x = other.pos.x + (this.pos.x - other.pos.x)/2;
            let y = other.pos.y + (this.pos.y - other.pos.y)/2;
            let replacementJoint = new Joint(this.bridge, new Pos(x,y));
            member.joints.add(replacementJoint);
            this.bridge.joints.add(replacementJoint);

        });

        // deletes neighbour references
        this.neighbours.forEach((joint) => {
            this.removeNeighbour(joint);
        })

        // no more references to this joint should remain, and it will be reclaimed by the garbage collector.
    }

    // DONE
    this.cost = () => {
        // the cost of joints depends on the thickness of the joint
        // each material component of each member attatched at the joint contributes to this thickness
        return (this.members.reduce((sum, cur) => {
            return sum + cur.materials.reduce((sum, cur) => {
                return sum + cur.size;
            });
        }));
    }

    // DONE
    this.select = () => {
        this.bridge.selected.joints.add(this);
    }

    // DONE
    this.deselect = () => {
        this.bridge.selected.joints.delete(this);
    }

    //DONE
    this.handleClick = (mousePos) => {
        if (this.pos.dist(mousePos) <= this.radius) {
            this.select();
        }
    }
}

//
const Member = function(bridge, joints) {
    this.force;
    this.bridge = bridge;
    this.load = 0;
    this.materials = [memberTypes[1]];
    this.joints = joints;
    this.thickness = 20;

    // DONE
    this.len = () => {
        let joints = Array(this.joints.values);
        return joints[0].dist(joints[1]);
    } 

    // DONE
    this.other = (joint) => {
        // returns the joint connected to this member on the other end of the provided joint
        [joint1, joint2] = Array.from(this.joints.values());
        return joint !== joint1 ? 
            joint1: 
            joint2; 
    }

    // DONE
    this.remove = () => {
        /* 
        ? deletes the reference to the member (between the two joints) from each joints members array and the bridge object.
        ? JS's garbage collector will then reclaim this object as no references will remain.
        */

        // removes references to joint from the parent bridge
        this.bridge.members.delete(this);
        this.bridge.selected.members.delete(this);

        //removes references on connected joints
        this.joints.forEach((joint) => {
            joint.members.delete(this);
        });
        //removes neighbour references on each joint
        [joint1, joint2] = Array.from(this.joints.values());
        joint1.removeNeighbour(joint2);

        // no more references to this member should remain, and it will be reclaimed by the garbage collector.
    }

    // DONE
    this.cost = () => {
        // the cost of a member group depends on each (and how many of each) type used between the member's joints
        let cost = this.materials.reduce((sum, cur) => {
            let cost;
            // NOTE there should be an option to for the user to pass these prices in via the GUI.  
            if (this.len() <= 90) {
                cost = cur.cost.short;
            }
            else {
                cost = cur.cost.long;
            }
            return sum+cost;
        });
                    
                            

        return cost;
    }

    // TODO
    this.stress = () => {
        //calculates the stress felt by the 
    }

    // DONE
    this.handleClick = (mousePos) => {
        let dist = mousePos.perpDistance(...this.joints);
        console.log(dist);
        if (dist <= this.thickness) {
            this.select();
        }
    }

};

const Bridge = function(canvas) {
    this.canvas = canvas;

    this.members = new Set();
    this.joints = new Set();
    this.selected = {
        joints: new Set(),
        members: new Set()
    }
    this.safetyFactor = 0.8;
    this.singleCapacity = 230;


    // TODO - event handler to be set up
    this.handleClick = (event) => {
        [...this.members, ...this.joints].forEach((entity) => {
            entity.handleClick();
        })
    }

    // DONE
    this.addJoint = (...args) => {
        // Is called when there are selected joints and the user left clicks the canvas (not on a joint) 
        for (let arg of args) {
            console.log(arg);
            console.log(args.length);

            joint = new Joint(this, arg);
            // makes the new joint a neighbour of every selected joint 
            this.selected.joints.forEach(selectedJoint => {
                selectedJoint.addNeighbour(joint); 
            });
            // adds reference to the joint
            this.joints.add(joint);
            console.log(this)
            
        }

    }
    // DONE
    this.addMember = (joint1, joint2) => {
        // Is called when there are selected joints and the user left clicks on a pre-existing joint.
        joint1.addNeighbour(joint2);
    }

    // TODO
    this.addPin = () => {
        
    }

    // TODO
    this.addRoller = () => {

    }

    // TODO
    this.ExternalForce = () => {

    }

    // DONE
    this.removeSelected = () => {
        //removing members leave joints unremoved
        this.selected.members.forEach((member)=> {
            this.removeMember(member);
        });
        //removing joints would have 
        this.selected.joints.forEach((joint)=> {
            this.removeJoint(joint);
        });
    }

    // DONE
    this.removeMember = (member) => {
        // delegates the removing to the member.
        member.remove();
    }

    // DONE
    this.removeJoint = (joint) => {
        // delegates the removing to the joint
        joint.remove();
    }

    // TODO - Testing required
    this.cost = () => {
        return [...this.members, ...this.joints].reduce((total, cur) => total + cur.cost(), 0);
    }

};

(function CollapsibleIIFE() {

    mousePos = new Pos(100,100);
    // initialisation of the bridge object
    bridge = new Bridge();
    console.log(bridge);
    
    // simulating a user clicking on the canvas
    bridge.addJoint(new Pos(100,100));
    console.log(bridge);
    
    // simulating selecting the joint that was just created
    let j = Array.from(bridge.joints.values())[0];
    j.select();
    j.name = "A";
    console.log(j);
    
    // simulating adding a new joint and connecting selected joints via new members
    bridge.addJoint(new Pos(200,100));
    
    // simulating deselecting the joint
    j.deselect();
    
    console.log(j.neighbours);
    
    console.log(bridge);
    
    bridge.joints.forEach((x) => x.select());
    
    bridge.addJoint(new Pos(200,200));
    
    console.log(j.neighbours);
    
    j.members.values().next().value.handleClick(mousePos);

    bridge.removeJoint(j);
    // exports = {Bridge: Bridge};

})();