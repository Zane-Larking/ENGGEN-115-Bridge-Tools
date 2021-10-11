import {IdGenerator} from './idGenerator.mjs';
import {Color, Vector, Pos} from './Objects.mjs';
import {MemberTable} from './memberTable.js';


const e = React.createElement;


let TestColor = new Color(1,2,3);
TestColor.rgb(); 

var neutralColor = new Color(150,150,150);
var compressionColor = new Color(24, 60, 204);
var tensionColor = new Color(204, 24, 24);

var selectedColor = new Color(19, 145, 40);
var jointColor = new Color(24, 143, 143);

var forceColor = new Color(200, 100, 30);
var loadColor = new Color(36, 179, 7);

function isIterable(input) {  
    if (input === null || input === undefined) {
        return false;
    }

    return typeof input[Symbol.iterator] === 'function';
}


/*
? #############################################################
? ################ Zones Constraints ##########################
? #############################################################
*/
function Zone(x, y) {
    this.x = x;
    this.y = y;
    this.color;
}
Zone.prototype.forbidden = function() {
    this.color = new Color(110, 106, 106);
    return this;
}
Zone.prototype.support = function() {
    this.color = new Color(168, 153, 84);
    return this;
}
Zone.prototype.loadingZone = function() {
    this.color = new Color(129, 201, 195);
    return this;
}

function RectZone(x,y,w,h) {
    Zone.call(this, x, y);
    this.w = w;
    this.h = h;
    
}
RectZone.prototype = Object.create(Zone.prototype);

function CircleZone(x, y, radius) {
    Zone.call(this, x, y);
    this.radius = radius;
}
CircleZone.prototype = Object.create(Zone.prototype);


// TODO
var zones = {
    forbidden: [
        new RectZone(200, 350, 450, 50).forbidden(), 
        new RectZone(550, 200, 100, 150).forbidden(), 
        new CircleZone(225, 75, 25).forbidden()
    ],
    loadingZone: [
        new RectZone(350, 50, 50, 300).loadingZone()
        
    ],
    support: [
        new RectZone(0, 200, 200, 200).support(),
        new RectZone(650, 200, 200, 200).support()

    ]
}


/*
? #############################################################
? ################ Member Strengths ###########################
? #############################################################
*/

// DONE
var compressiveStrength = (stiffnessFactor) => {
    // Critical Buckling constant = pi^2 x E x I
    // where, E = 10 Gpa, and I = 6 mm^4 = 6 * 10**(-12)
    const constant = 10000000000 * Math.PI**2 * 6 * 10**(-12);
    let formula = (length, safetyFactor) => {
        // console.log("compression" ,length, safetyFactor, stiffnessFactor, constant);
        return (constant / (length/1000)**2) * stiffnessFactor * safetyFactor;
    }
    return formula;
}

// DONE
var tensionStrength = (stiffnessFactor) => {
    // single capacity for aparata pine is 230 N
    let formula = (singleCapacity, safetyFactor) => {
        // console.log("tension", length, safetyFactor, stiffnessFactor, singleCapacity);
        return singleCapacity * stiffnessFactor * safetyFactor;
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


/*
? #############################################################
? ################ Bridge Object Types ########################
? #############################################################
*/


// DONE
var jointTypes = [
    {cost: 150, radius: 10, color: new Color(24, 143, 143)},
    {cost: 300, radius: 15, color: new Color(13, 74, 74)},
    {cost: NaN, radius: 20, color: new Color(3, 15, 15)}
]


// TODO
const ExternalForce = function(mag, angle) {
    this.mag = mag;
    this.angle = angle;
}

// TODO
const Pin = function(bridge, joint) {
    this.joint = joint.pos;
    this.horizontal = new ExternalForce(bridge, joint, new Vector(undefined, 0));
    this.vertical = new ExternalForce(bridge, joint, new Vector(undefined, Math.PI/2));

}

// TODO
const roller = function(bridge, joint) {
    this.pos = joint.pos;
    this.horizontal = new ExternalForce(bridge, joint, new Vector(undefined, 0));
    this.vertical = new ExternalForce(bridge, joint, new Vector(undefined, Math.PI/2));

}

// TODO
const Joint = function(bridge, pos) {
    this.bridge = bridge;
    this.pos = pos;
    this.id = this.bridge.ids.next();
    this.selected = 0;

    this.neighbours = new Set();
    this.members = new Set();
    this.type = jointTypes[0];
    this.size = 0;

    this.extForces = new Set();
    

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
        joint.members.add(member);
        // adds a reference in parent bridge
        this.bridge.members.add(member);

        // Updates joint type
        this.setType();
    } 

    // DONE
    this.removeNeighbour = (joint) => {
        this.neighbours.delete(joint);
        joint.neighbours.delete(this);
        
        // Updates joint type
        this.setType();
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
    this.remove = (rebase = 0) => {
        // deletes the joint and all members attatched to it    
        // deletes or rebases any members connected to the joint
        this.members.forEach((member) => {
            console.log(member);
            if (bridge.settings.replaceJoint || rebase) {
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
    this.setType = () => {
        this.size = (Array.from(this.members.values).reduce((sum, cur) => {
            return sum + cur.material.reduce((sum, cur) => {
                return sum + (cur.type.size * cur.count);
            });
        }, 0));
        
        // sets type
        this.type = jointTypes.reduce((prev, cur) => {
            return (this.size <= cur.size ? cur : prev);
        })
    }

    // DONE
    this.cost = () => {
        // the cost of joints depends on the thickness of the joint
        // each material component of each member attatched at the joint contributes to this thickness
        return this.type.cost;
    }

    // DONE
    this.isMouseOver = () => {
        let dist = this.pos.dist(this.bridge.mouse);
        return dist <= this.type.radius;
    }

    this.collideWithZone = (zone) => {
        let radius = (this.bridge.settings.fullCollision? this.type.radius : 0);
        if (zone instanceof CircleZone) {
            let distX = Math.abs(this.pos.x - zone.x);
            let distY = Math.abs(this.pos.y - zone.y);
            return (distX**2 + distY**2 <= (zone.radius + radius)**2);
        }
        if (zone instanceof RectZone) {
            let distX = Math.abs(this.pos.x - zone.x-zone.w/2);
            let distY = Math.abs(this.pos.y - zone.y-zone.h/2);
        
            if (distX > (zone.w/2 + radius)) { return false; }
            if (distY > (zone.h/2 + radius)) { return false; }
        
            if (distX <= (zone.w/2)) { return true; } 
            if (distY <= (zone.h/2)) { return true; }
        
            let dx=distX-zone.w/2;
            let dy=distY-zone.h/2;
            return (dx*dx+dy*dy<=(radius*radius));
            

        }
    }

    this.uncollideWithZone = (zone) => {
        let radius = (this.bridge.settings.fullCollision? this.type.radius : 0);
        if (zone instanceof CircleZone) {
            //finds how much collision there is 
            let distX = this.pos.x - zone.x;
            let distY = this.pos.y - zone.y;
            let dist = Math.sqrt(distX**2 + distY**2) - Math.sqrt((zone.radius + radius)**2);

            // calculates the angle between
            let angle = Math.atan(distY/distX);

            if (distX < 0) {
                this.pos.x += dist * Math.cos(angle);
                this.pos.y += dist * Math.sin(angle);
                
            }
            else {
                this.pos.x -= dist * Math.cos(angle);
                this.pos.y -= dist * Math.sin(angle);
                
            }
        }
        if (zone instanceof RectZone) {
            let distX = this.pos.x - zone.x-zone.w/2;
            let distY = this.pos.y - zone.y-zone.h/2;
        
            // if (distX > (zone.w/2 + this.type.radius)) { return false; }
            // if (distY > (zone.h/2 + this.type.radius)) { return false; }
            // console.log(distX, distY);
        
            if (Math.abs(distX) <= zone.w/2 || Math.abs(distY) <= zone.h/2) {
                if (Math.abs(distX)/(zone.w/2) > Math.abs(distY)/(zone.h/2)) {
                    if (distX > 0) {
                        this.pos.x += (zone.w/2 - distX) + radius;   
                    }
                    else {
                        this.pos.x -= ((zone.w/2 + distX) + radius);
                    }
                }
                else {
                    if (distY > 0) {
                        this.pos.y += (zone.h/2 - distY) + radius;   
                    }
                    else {
                        this.pos.y -= ((zone.h/2 + distY) + radius);
                    }
                }
            } 
            // if (distX >= zone.w/2) {
            // } 
            // if (distY <= (zone.h/2)) { return true; }
        
            // let dx=distX-zone.w/2;
            // let dy=distY-zone.h/2;
            // return (dx*dx+dy*dy<=(this.type.radius*this.type.radius));
            

        }
    }

    // DONE
    this.select = (clear = 0) => {
        if (clear) {
            this.bridge.clearSelections();
        }
        this.selected = true;
        this.bridge.selected.joints.add(this);
    }

    // DONE
    this.deselect = () => {
        this.selected = false;
        this.bridge.selected.joints.delete(this);
    }

    //DONE
    this.handleClick = (event, mousePos) => {
        // ?returns 0 if mouse not over; 1 if joint was added to selection; or 2 if a member was added.

        // tests if the cursor is over the joint
        if (this.isMouseOver()) {
            console.log("YOU GOT ME!");
            console.log(this);
            // if the shift key is pressed add to selection
            if (event.shiftKey) {
                if (this.selected) {
                    this.deselect();
                }
                else {
                    this.select();
                }

                // signals an the canvas needs to be redrawn
                return 1;
            }
            // else if there are currently selected joints this as their neighbour
            else if (this.bridge.joints.size > 0) {
                this.bridge.selected.joints.forEach((joint) => {
                    //if not already a neighbour
                    if (!this.neighbours.has(joint)){
                        joint.addNeighbour(this);
                    }
                    
                })
                if (!event.ctrlKey) {
                    this.bridge.clearSelections();
                }
                this.select();

                // signals an update is required
                return 2;
            }
            // else add add this joint the the selection set
            else {
                this.select();

                // signals an the canvas needs to be redrawn
                return 1;

            }
            
            console.log(this.bridge.selected);
        }
        else {
            console.log("YOU MISSED ME!");
            return 0;
        }
    }
}

//
const Member = function(bridge, joints) {
    this.force = 0;
    this.bridge = bridge;
    this.load = 0;
    this.material = {type: memberTypes[0], count: 1};
    this.joints = joints;
    this.thickness = 20;
    this.selected = false;
    
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
        let len = joints[0].pos.dist(joints[1].pos);
        return len
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

    this.isMouseOver = () => {
        let dist = this.bridge.mouse.perpDistance(...Array.from(this.joints).map((joint) => {return joint.pos;}));
        return dist != -1 && dist <= this.thickness/2;
        // console.log(dist);
        
    }

    // DONE
    this.select = () => {
        this.bridge.selected.members.add(this);
        this.selected = true;
    }

    // DONE
    this.deselect = () => {
        this.bridge.selected.members.delete(this);
        this.selected = false;
    }

    this.center = () => {
        let [joint1, joint2] = Array.from(this.joints.values());
        let x = (joint1.pos.x + joint2.pos.x)/2;
        let y = (joint1.pos.y + joint2.pos.y)/2;
        return new Pos(x,y);

    }

    this.cap = (safetyFactor) => {
        if (this.force < 0) {
            return this.material.type.tension(this.len(), safetyFactor) * this.material.count;
        }
        else {
            return this.material.type.compression(this.len(), safetyFactor) * this.material.count;
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
            let cost = this.material.type.cost.short * this.material.count
            return cost;
        }
        else {
            let cost =  this.material.type.cost.long * this.material.count;
            return cost;
        }
    }

    // TODO
    this.stress = () => {
        //calculates the stress felt by the 
    }

    // DONE
    this.handleClick = (event) => {

        // collision
        if (this.isMouseOver()) {
            // if shift is pressed add member to selection
            if (event.shiftKey) {
                this.select();
            }
            // else clear selection first
            else {
                this.bridge.selected.joints.clear();
                this.bridge.selected.members.clear();
                this.select();
            }
            return 1;
        }
        else {
            return 0;
        }
    }


};

export const Bridge = function(canvasManager, mouse) {
    this.CM = canvasManager;
    this.domContainer = document.querySelector('tbody');
    
    this.mouse = mouse;
    this.mouse.dragging = false;
    this.settings = {
        replaceJoint: false,
        showLengths: true,
        fontSize: 15,
        showLabels: true
    };
    this.ids = new IdGenerator();
    this.UI = {
        lengthInput: document.querySelector("#length"),
        angleInput: document.querySelector("#angle"), 
        forceBtn:  document.querySelector("#force-btn"),
        pinBtn: document.querySelector("#pin-btn"),
        rollerBtn: document.querySelector("#roller-btn"),
        lengthBtn: document.querySelector("#lengths-btn"),
        labelsBtn: document.querySelector("#labels-btn"),
        replaceJointBtn: document.querySelector("#replace-joint-btn"),
    }
    
    this.size = 10;
    this.members = new Set();
    this.joints = new Set();
    this.selected = {
        joints: new Set(),
        members: new Set()
    }
    this.forceJoints = new Set();
    this.pin;
    this.roller;
    this.safetyFactor = 0.8;
    this.singleCapacity = 230;

    this.btns = {
        forceBtn: document.querySelector("#force-btn"),
        pinBtn: document.querySelector("#pin-btn"),
        rollerBtn: document.querySelector("#roller-btn"),
        lengthsBtn: document.querySelector("#lengths-btn"),
        labelsBtn: document.querySelector("#labels-btn"),
        replaceJointsBtn: document.querySelector("#replace-joints-btn")
    }

    this.domContainer = document.querySelector('tbody');
    
    this.init = (canvas) => {
        // click event for canvas
        canvas.addEventListener("click", this.handleClick);
        canvas.addEventListener("mousedown", this.handleMouseDown);
        canvas.addEventListener("mousemove", this.handleMouseMove);
        canvas.addEventListener("mouseup", this.handleMouseUp);
        canvas.addEventListener("mouseup", this.handleMouseUp);



        // workaround for making keydown events work for canvas
        var lastDownTarget
        /* For mouse event */
        document.addEventListener('mousedown', (event) => {
            lastDownTarget = event.target;
        }, false);

        /* For keyboard event */
        document.addEventListener('keydown', (event) => {
            if(lastDownTarget == canvas) {
                this.handleKeyDown(event);
            }
        }, false);
        this.update();
    }

    this.handleKeyDown = (event) => {
        console.log("key pressed");
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }

        // delete (Delete)
        if (event.key == "Delete") {
            console.log("DELETE!");
            this.removeSelected();
        }
        
        // cancel selection (ESC)
        if (event.key == "Escape") {
            console.log("clearing selection");
            this.clearSelections();
        }
        switch (event.key) {
            case "Down": // IE/Edge specific value
            case "ArrowDown":
              // Do something for "down arrow" key press.
              break;
            case "Up": // IE/Edge specific value
            case "ArrowUp":
              // Do something for "up arrow" key press.
              break;
            case "Left": // IE/Edge specific value
            case "ArrowLeft":
              // Do something for "left arrow" key press.
              break;
            case "Right": // IE/Edge specific value
            case "ArrowRight":
              // Do something for "right arrow" key press.
              break;
            case "Enter":
              // Do something for "enter" or "return" key press.
              break;
            case "Esc": // IE/Edge specific value
            case "Escape":
              // Do something for "esc" key press.
              break;
            default:
              return; // Quit when this doesn't handle the key event.
          }
          // Cancel the default action to avoid it being handled twice
        event.preventDefault();
    }


    // drag and drop functionality
    this.handleMouseDown = (e) => {

        // save the mouse position
        // in case this becomes a drag operation
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;

        // hit test all existing joints and members
        var hit = [...Array.from(this.selected.joints.values()), ...Array.from(this.selected.members.values())].some((entity) => {
            return entity.isMouseOver();
        });


        // if no hits then add a circle
        // if hit then set the isDown flag to start a drag
        if (hit) {
            console.log(hit);
            this.mouse.dragging = true;
            this.mouse.dragged = true;
        } else {
            console.log("No Selected Joint At Cursor");
        }
    }

    this.handleMouseMove = (e) => {
        // if we're not dragging, just exit
        if (!this.mouse.dragging) { return; }

        // tell the browser we'll handle this event
        e.preventDefault();
        e.stopPropagation();

        // * calculate how far the mouse has moved
        // since the last mousemove event was processed
        var dx = this.mouse.x - this.mouse.lastX;
        var dy = this.mouse.y - this.mouse.lastY;

        // reset the lastX/Y to the current mouse position
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;

        // change the target circles position by the 
        // distance the mouse has moved since the last
        // mousemove event

        // returns an array of all the joints on selected members (including double-ups)
        let jointsOnSelectedMembers = Array.from(this.selected.members.values()).reduce((prev, cur) => [...prev, ...cur.joints], []);

        let selectedJoints = new Set([...jointsOnSelectedMembers, ...this.selected.joints]);

        // console.log(selectedJoints);

        selectedJoints.forEach((joint) => {
            joint.pos.x += dx;
            joint.pos.y += dy;

            // adjusts for collision with zones
            [...zones.forbidden, ...zones.support].forEach((zone) => {
                if (joint.collideWithZone(zone)) {
                    joint.uncollideWithZone(zone);
                }
            }); 
        });

        this.draw();
    }

    this.handleMouseUp = (e) => {
        // tell the browser we'll handle this event
        e.preventDefault();
        e.stopPropagation();

        // stop the drag
        this.mouse.dragging = false;

        this.update();
    }

    // TODO - event handler to be set up
    this.handleClick = (event) => {

        // returns if dragging occured
        if (this.mouse.dragged) {
            this.mouse.dragged = false;
            return
        }
        console.log("clicked");
        let entityClicked = [...this.joints, ...this.members].find((entity) => {
            console.log(this.members);
            return entity.handleClick(event, this.mouse);
        });

        console.log(entityClicked);

        if (!entityClicked && !event.shiftKey) {
            let joint = this.addJoint(new Pos(this.mouse.x, this.mouse.y));
            
            if (!event.ctrlKey) {
                this.clearSelections();
            }
            joint.select();
            this.update();
        } 
        else {
            // this.draw();
            this.update();
        }
    }

    this.dimensions = () => {
        
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

            return joint;
            
        }

        //updates the view
        this.update();

    }
    // DONE
    this.addMember = (joint1, joint2) => {
        // Is called when there are selected joints and the user left clicks on a pre-existing joint.
        joint1.addNeighbour(joint2);

        //updates the view
        this.update();
    }

    // TODO
    this.setPin = () => {
        // only one joint can be made a pin
        if (this.selected.joints.size > 1) {
            return;
        }
        this.pin = this.selected.joints.values().next().value;
        
        //updates the view
        this.update();
    }

    // TODO
    this.setRoller = () => {
        if (this.selected.joints.size > 1) {

        }
        this.roller = this.selected.joints.values().next().value;

        //updates the view
        this.update();
    }

    this.isDeterminant = () => {
        return this.pin != undefined && this.roller != undefined && this.members.size == (this.joints.size*2 - 3);
    }

    // TODO
    this.addExtForce = (mag, angle) => {
        this.selected.joints.forEach((joint) => {
            // adds a force to the joints set
            joint.extForces.add(new ExternalForce(mag, angle));
            // adds the joint to the bridges set
            this.forceJoints.add(joint);
        })
    }

    // TODO
    this.removeExtForce = () => {

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
        this.update();
    }

    // DONE
    this.removeMember = (member) => {
        // delegates the removing to the member.
        member.remove();

        //updates the view
        this.update();
    }

    // DONE
    this.removeJoint = (joint) => {
        // delegates the removing to the joint
        joint.remove();

        this.updateLengthInput();
        //updates the view
        this.update();
    }

    // TODO
    this.updateLengthInput = () => {

    }

    this.clearSelections = () => {
        this.selected.joints.clear();
        this.selected.members.clear();
        this.draw();
    }

    this.verifyLoad = () => {

    }

    // TODO 
    this.calc  = () => {
        
        // calculates cost
        
        // update total cost
        
        // update table
        ReactDOM.render(memberTable, domContainer);
    }
    
    // TODO
    this.strain = () => {
        // returns false if the 
        if (!this.isDeterminant) {
            return false
        }
        return true;
        // 
    }  
    
    // TODO - Testing required
    this.cost = () => {
        // calcutes total cost (runs cost methods on each bridge entity)
        console.log([...this.members, ...this.joints]);
        return [...this.members, ...this.joints].reduce((total, cur) => total + cur.cost(), 0);
    }
    
    this.update = () => {
        // TODO
        // * calculates member capacities and total capacity component
        let solved = this.strain();
        
        // TODO
        // * deteminancy notification
        if (solved) {
            console.log("strain updated");
        }
        else {
            console.log("failed to update strain");
        }

        // TODO
        // * updates the costs component
        console.log(this.cost());
        document.querySelector("#total-cost").innerText = this.cost();
        
        // TODO
        // * updates the members table component
        
        let memberTable = MemberTable({members: this.members});
        ReactDOM.render(memberTable, this.domContainer);
        

        // *draws the canvas
        this.draw();

        // adjust the size of components
        document.querySelector("#UI").style.gridTemplateRows = "auto min-content"; 


        // ReactDOM.render(memberTable, domContainer);


        

    }

    this.displayLength = (member) => {
        // Display member lengths as text on the canvas
        let memberCenter = member.center();
        
        this.CM.ctx.font = `bolder ${this.settings.fontSize}px Arial`;
        this.CM.ctx.textAlign = "center";
        
        this.CM.ctx.fillStyle = "rgb(0,0,0)";
        this.CM.ctx.fillText(member.len().toFixed(2) + " mm", memberCenter.x, memberCenter.y);
    }
    this.draw = () => {
        this.CM.clear();

        
        // * draws all supports and zones
        // loadingZone zones
        zones.loadingZone.forEach((zone) => {
            if (zone instanceof RectZone) {
                this.CM.ctx.fillStyle = zone.color.rgba();
                this.CM.ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
            }
            else if (zone instanceof CircleZone) {
                this.CM.circle(zone.x, zone.y, zone.radius, zone.color.rgba());

            }
        });
        // supports
        zones.support.forEach((zone) => {
            if (zone instanceof RectZone) {
                this.CM.ctx.fillStyle = zone.color.rgba();
                this.CM.ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
            }
            else if (zone instanceof CircleZone) {
                this.CM.circle(zone.x, zone.y, zone.radius, zone.color.rgba());

            }
        });

        //forbidden zones
        zones.forbidden.forEach((zone) => {
            // console.log(zone);
            if (zone instanceof RectZone) {
                this.CM.ctx.fillStyle = zone.color.rgba();
                this.CM.ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
            }
            else if (zone instanceof CircleZone) {
                // console.log("circle")
                this.CM.circle(zone.x, zone.y, zone.radius, zone.color.rgba());
            }
        });

        
        // draws pins and rollers
        if (this.roller != undefined) {
            this.CM.roller(this.roller.pos.x, this.roller.pos.y, neutralColor.rgb(), this.size, -Math.PI/2);
            console.log(this.roller)
        }
        if (this.pin != undefined) {
            this.CM.pin(this.pin.pos.x, this.pin.pos.y, neutralColor.rgb(), this.size, -Math.PI/2);
        }


        // TODO
        // recalculates all forces
        this.strain();

        // draws all members
        this.members.forEach((member) => {

            // member capacity
            let [joint1, joint2] = Array.from(member.joints.values());
            let percentage = member.force/member.cap(this.safetyFactor);


            //member color
            let forceColor = Object.assign(member.force <= 0? compressionColor: tensionColor);  
            let color = new Color().lerp(neutralColor, forceColor, percentage);
            
            let selected = this.selected.members.has(member);
            if (selected) {
                
                this.CM.ctx.shadowBlur = 20;
                this.CM.ctx.shadowColor = selectedColor.rgb();
                this.CM.ctx.fillStyle = selectedColor.rgb();
                this.CM.line(joint1.pos.x, joint1.pos.y, joint2.pos.x, joint2.pos.y, selectedColor.rgb(), this.size*1.2);
                
            }

            // Draws line
            this.CM.ctx.shadowBlur = 0;
            this.CM.line(joint1.pos.x, joint1.pos.y, joint2.pos.x, joint2.pos.y, color.rgb(), this.size);
            
            if (this.settings.showLengths || selected) {
                this.displayLength(member);
            }
            
        });

        // draws all joints
        this.joints.forEach((joint) => {
            let color = (this.selected.joints.has(joint)? selectedColor: jointColor)
            this.CM.circle(joint.pos.x, joint.pos.y, joint.type.radius, color.rgb())

            // Text
            if (this.settings.showLabels) {
                let x = joint.pos.x - 20;
                let y = joint.pos.y - 20;

                this.CM.ctx.font = `bolder ${this.settings.fontSize}px Arial`;
                this.CM.ctx.textAlign = "center";

                this.CM.ctx.fillStyle = "rgb(0,0,0)";
                this.CM.ctx.fillText(joint.id, x, y);
            }
        });
        

        // DONE
        //draws all forces
        this.forceJoints.forEach((joint) => {
            let x = joint.pos.x //+ force.vector.mag * Math.cos(force.vector.angle);
            let y = joint.pos.y //+ force.vector.mag * Math.sin(force.vector.angle);
            
            let isValidLoad = zones.loadingZone.some((zone) => {
                return joint.collideWithZone(zone);
            });
            (isValidLoad? this.load = joint: delete this.load);

            let color = (isValidLoad? loadColor : forceColor);
            // checks if force is in a loading zone
            joint.extForces.forEach((force) => {
                this.CM.arrow(x, y, force.mag/10, force.angle, color.rgb(), this.size);
            })
        });

        // TODO
        // draws pin joint
        if (this.pin != undefined) {
            this.CM.triangleTip(this.pin.x, this.pin.y, this.size);
            
        } 

        // draws roller joint
    }


    // TODO
    this.save = () => {
        // creates a encoded string containing enough information about the current bridge to load it again.

    }

    this.load = () => {
        // creates a bridge from an encoded string.

    }
};



