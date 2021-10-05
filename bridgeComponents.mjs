import {IdGenerator} from './idGenerator.mjs';
import {Color, Vector, Pos} from './Objects.mjs';


let TestColor = new Color(1,2,3);
TestColor.rgb(); 

var neutralColor = new Color(150,150,150);
var compressionColor = new Color(24, 60, 204);
var tensionColor = new Color(204, 24, 24);

var selectedColor = new Color(19, 145, 40);
var jointColor = new Color(24, 143, 143)

function isIterable(input) {  
    if (input === null || input === undefined) {
        return false;
    }

    return typeof input[Symbol.iterator] === 'function';
}



// DONE
var compressiveStrength = (stiffnessFactor) => {
    // Critical Buckling constant = pi^2 x E x I
    // where, E = 10, and I = 6 mm^4
    const constant = 10 * Math.PI**2 * 6;
    let formula = (length, safetyFactor) => {
        (constant / length**2) * stiffnessFactor * safetyFactor;
    }
    return formula;
}

// DONE
var tensionStrength = (stiffnessFactor) => {
    // single capacity for aparata pine is 230 N
    let formula = (singleCapacity, safetyFactor) => {
        singleCapacity * stiffnessFactor * safetyFactor;
    }
    return formula;
}

// DONE
var memberTypes = [
    {name: "type 1", cost: {short: 2200, long: 5250}, size: 1, tension: tensionStrength(1), compression: compressiveStrength(1)},
    {name: "type 2", cost: {short: 6600, long: 15750}, size: 2, tension: tensionStrength(2.28), compression: compressiveStrength(8)},
    {name: "type 3", cost: {short: 9900, long: 23620}, size: 3, tension: tensionStrength(3.6), compression: compressiveStrength(27)},
    {name: "type 4", cost: {short: 8250, long: 19680}, size: 2, tension: tensionStrength(2), compression: compressiveStrength(26)},
    {name: "type 5", cost: {short: 11000, long: 26000}, size: 2, tension: tensionStrength(2), compression: compressiveStrength(56)}
]


// TODO
const ExternalForce = function(bridge, joint, vector) {
    this.force = vector;
    this.joint = joint;

    joint.externalForces.push(this);

    bridge.externalForces.push(this);
    joint.force = this;

}

// TODO
const Pin = function(bridge, joint) {
    this.joint = joint.pos;
    this.horizontal = new ExternalForce(bridge, joint, new Vector(undefined, 0));
    this.vertical = new ExternalForce(bridge, joint, new Vector(undefined, 90));

}

// TODO
const roller = function(bridge, joint) {
    this.pos = joint.pos;
    this.horizontal = new ExternalForce(bridge, joint, new Vector(undefined, 0));
    this.vertical = new ExternalForce(bridge, joint, new Vector(undefined, 90));

}

// TODO
const Joint = function(bridge, pos) {
    this.bridge = bridge;
    this.pos = pos;
    this.id = this.bridge.ids.next();

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

        // deletes or rebases any members connected to the joint
        this.members.forEach((member) => {

            if (bridge.settings.replaceJoint) {
                // gets reference to the members other joint
                let other = member.other(this);
                
                // removes joint
                member.remove();

                // TODO assign the same material as the replaced member

                // adds a replacement joint
                let x = other.pos.x + (this.pos.x - other.pos.x)/2;
                let y = other.pos.y + (this.pos.y - other.pos.y)/2;
                let replacementJoint = new Joint(this.bridge, new Pos(x,y));
                this.bridge.joints.add(replacementJoint);

                // creates new member
                this.bridge.addMember(other, replacementJoint);

            } else {
                member.remove();
            }
            
            
        });
        // removes references to joint from the parent bridge
        this.bridge.joints.delete(this);
        this.bridge.selected.joints.delete(this);
        
        // deletes neighbour references
        // this.neighbours.forEach((joint) => {
        //     this.removeNeighbour(joint);
        // })

        // no more references to this joint should remain, and it will be reclaimed by the garbage collector.
    }


    // DONE
    this.cost = () => {
        // the cost of joints depends on the thickness of the joint
        // each material component of each member attatched at the joint contributes to this thickness
        return (this.members.reduce((sum, cur) => {
            return sum + cur.material.reduce((sum, cur) => {
                return sum + (cur.type.size * cur.count);
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
        console.log("Hello?");
        if (this.pos.dist(mousePos) <= this.radius) {
            this.select();
            console.log("YOU GOT ME!");
            return 1;
        }
        else {
            console.log("YOU MISSED ME!");
            return 0;
        }
    }
}

//
const Member = function(bridge, joints) {
    this.force;
    this.bridge = bridge;
    this.load = 0;
    this.material = {type: memberTypes[1], count: 1};
    this.joints = joints;
    this.thickness = 20;
    
    this.id = (() => {
        let joints = this.joints.values();
        let joint1 = joints.next().value;
        let joint2 = joints.next().value;
        let id =`${joint1.id}${joint2.id}`
        return id;
    })();

    // DONE
    this.len = () => {
        let joints = Array.from(this.joints.values());
        return joints[0].pos.dist(joints[1]);
    } 

    // DONE
    this.other = (joint) => {
        // returns the joint connected to this member on the other end of the provided joint
        let [joint1, joint2] = Array.from(this.joints.values());
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
        let [joint1, joint2] = Array.from(this.joints.values());
        joint1.removeNeighbour(joint2);

        // no more references to this member should remain, and it will be reclaimed by the garbage collector.
    }

    this.cap = (safetyFactor) => {
        if (this.force < 0) {
            this.material.type.tension(this.length, safetyFactor) * this.material.count;
        }
        else {
            this.material.type.compression(this.length, safetyFactor) * this.material.count;
        }
    }

    // TODO
    this.rebase = () => {
        // deletes this member and creates a replacement member with different joints and a new React id but with the same material properties.
        
        
    }

    // DONE
    this.cost = () => {
        // the cost of a member group depends on which type used is between the member's joints and how many
        // NOTE there should be an option to for the user to pass these prices in via the GUI.  

        if (this.len() <= 90) {
            return this.material.type.cost.short * cur.count;
        }
        else {
            return this.material.type.cost.short * this.material.count;
        }
    }

    // TODO
    this.stress = () => {
        //calculates the stress felt by the 
    }

    // DONE
    this.handleClick = () => {
        console.log(this.bridge.mouse);
        let dist = this.bridge.mouse.perpDistance(...this.joints);
        console.log(dist);
        if (dist <= this.thickness) {
            this.select();
            return 1;
        }
        else {
            return 0;
        }
    }


};

export const Bridge = function(canvasManager, mouse) {
    this.CM = canvasManager;
    this.mouse = mouse;
    this.settings = {
        replaceJoint: 1,
    };
    this.ids = new IdGenerator();
    
    this.size = 10;
    this.members = new Set();
    this.joints = new Set();
    this.selected = {
        joints: new Set(),
        members: new Set()
    }
    this.externalForces;
    this.pin;
    this.roller;
    this.safetyFactor = 0.8;
    this.singleCapacity = 230;


    // TODO - event handler to be set up
    this.handleClick = (event) => {
        let entityClicked = [...this.members, ...this.joints].some((entity) => {
            return entity.handleClick(Object.assign({},this.mouse));
        });

        if (!entityClicked) {
            this.addJoint(Object.assign({},this.mouse));
        } 
    }

    // DONE
    this.addJoint = (...args) => {
        // Is called when there are selected joints and the user left clicks the canvas (not on a joint) 
        for (let arg of args) {
            // console.log(arg);
            // console.log(args.length);

            let joint = new Joint(this, arg);
            // makes the new joint a neighbour of every selected joint 
            this.selected.joints.forEach(selectedJoint => {
                selectedJoint.addNeighbour(joint); 
            });
            // adds reference to the joint
            this.joints.add(joint);
            // console.log(this);
            
        }

        //updates the view
        this.draw();

    }
    // DONE
    this.addMember = (joint1, joint2) => {
        // Is called when there are selected joints and the user left clicks on a pre-existing joint.
        joint1.addNeighbour(joint2);

        //updates the view
        this.draw();
    }

    // TODO
    this.addPin = () => {
        

        //updates the view
        this.draw();
    }

    // TODO
    this.addRoller = () => {


        //updates the view
        this.draw();
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

        //updates the view
        this.draw();
    }

    // DONE
    this.removeJoint = (joint) => {
        // delegates the removing to the joint
        joint.remove();

        //updates the view
        this.draw();
    }

    // TODO 
    this.calc  = () => {
        // update table

        // calculates cost

        // update total cost

    }

    // TODO
    this.st

    // TODO - Testing required
    this.cost = () => {
        // calcutes total cost (runs cost methods on each bridge entity)
        return [...this.members, ...this.joints].reduce((total, cur) => total + cur.cost(), 0);
    }

    
    this.draw = () => {
        this.CM.clear();

        // TODO
        // recalculates all forces

        // draws all members
        this.members.forEach((member) => {
            let [joint1, joint2] = Array.from(member.joints.values());
            let percentage = member.force/member.cap(this.safetyFactor);

            let forceColor = Object.assign(member.force < 0? compressionColor: tensionColor);         
            
            forceColor.lerp(neutralColor, percentage);
            
            if (this.selected.members.has(member)) {
                
                this.CM.ctx.shadowBlur = 20;
                this.CM.ctx.shadowColor = selectedColor.rgb();
                this.CM.ctx.fillStyle = selectedColor.rgb();
                this.CM.line(joint1.pos.x, joint1.pos.y, joint2.pos.x, joint2.pos.y, selectedColor.rgb(), this.size*1.2);
            }
            
            this.CM.ctx.shadowBlur = 20;
            this.CM.line(joint1.pos.x, joint1.pos.y, joint2.pos.x, joint2.pos.y, forceColor.rgb(), this.size);
        });

        // draws all joints
        this.joints.forEach((joint) => {
            let color = (this.selected.joints.has(joint)? selectedColor: jointColor)
            this.CM.circle(joint.pos.x, joint.pos.y, this.size, color.rgb())
        });

        // TODO
        //draws all forces
        // this.externalForces.forEach((force) => {

        // });

        // TODO
        // draws pin joint
        if (this.pin != undefined) {
            this.CM.triangleTip(this.pin.x, this.pin.y, this.size);
            
        } 

        // draws roller joint
    }


};



