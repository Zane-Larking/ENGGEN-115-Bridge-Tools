import { IdGenerator } from './idGenerator.mjs';
import { Color, Vector, Pos } from './Objects.mjs';
import { MemberTable } from './memberTable.js';
import { Ceres } from 'https://cdn.jsdelivr.net/gh/Pterodactylus/Ceres.js@master/Ceres-v1.5.3.js'


const e = React.createElement;

function degrees(radians)
{
  var pi = Math.PI;
  return radians * (180/pi);
}
function radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

let TestColor = new Color(1, 2, 3);
TestColor.rgb();

var invalidColor = new Color(43, 43, 43);

var neutralColor = new Color(150, 150, 150);
var compressionColor = new Color(24, 60, 204);
var tensionColor = new Color(204, 24, 24);

var selectedColor = new Color(19, 145, 40, 0);
var jointColor = new Color(24, 143, 143);

var forceColor = new Color(200, 100, 30);
var loadColor = new Color(36, 179, 7);

var labelColor = new Color(209, 145, 27);

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
Zone.prototype.forbidden = function () {
    this.color = new Color(110, 106, 106);
    return this;
}
Zone.prototype.support = function () {
    this.color = new Color(168, 153, 84);
    return this;
}
Zone.prototype.loadingZone = function () {
    this.color = new Color(129, 201, 195);
    return this;
}

function RectZone(x, y, w, h) {
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
    const constant = 10000000000 * Math.PI ** 2 * 6 * 10 ** (-12);
    let formula = (length, safetyFactor) => {
        // console.log("compression" ,length, safetyFactor, stiffnessFactor, constant);
        return (constant / (length / 1000) ** 2) * stiffnessFactor * safetyFactor;
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
    { id: 0,name: "Type 1", cost: { short: 2200, long: 5250 }, size: 1, tension: tensionStrength(1), compression: compressiveStrength(1) },
    { id: 1,name: "Type 2", cost: { short: 6600, long: 15750 }, size: 2, tension: tensionStrength(2.28), compression: compressiveStrength(8) },
    { id: 2,name: "Type 3", cost: { short: 9900, long: 23620 }, size: 3, tension: tensionStrength(3.6), compression: compressiveStrength(27) },
    { id: 3,name: "Type 4", cost: { short: 8250, long: 19680 }, size: 2, tension: tensionStrength(2), compression: compressiveStrength(26) },
    { id: 4,name: "Type 5", cost: { short: 11000, long: 26000 }, size: 2, tension: tensionStrength(2), compression: compressiveStrength(56) }
]


/*
? #############################################################
? ################ Bridge Object Types ########################
? #############################################################
*/


// DONE
var jointTypes = [
    { cost: 150, radius: 10, color: new Color(24, 143, 143) },
    { cost: 300, radius: 15, color: new Color(13, 74, 74) },
    { cost: NaN, radius: 20, color: new Color(3, 15, 15) }
]


// TODO
const ExternalForce = function (joint, mag, angle) {
    this.joint = joint;
    this.mag = mag;
    this.angle = angle;
    this.tipPos;
    this.selected = false;
}
ExternalForce.prototype.tipPos = function () {
    return new Pos(
        this.joint.pos.x + this.mag / 10 * Math.cos(this.angle),
        this.joint.pos.y - this.mag / 10 * Math.sin(this.angle)
    )
}
ExternalForce.prototype.handleClick = function (event, mouse) {
    if (this.isMouseOver(mouse)) {
        console.log("YOU GOT ME!");
        console.log(this);
        // if the shift key is pressed add to selection
        if (event.shiftKey) {
            this.selected ? this.deselect() : this.select();

            // signals an the canvas needs to be redrawn
            return 1;
        }
        // else add add this joint the the selection set
        else {
            this.select(1);

            // signals an the canvas needs to be redrawn
            return 1;

        }
    }
}
ExternalForce.prototype.isMouseOver = function (mouse) {
    let tipPos = this.tipPos();
    let dist = mouse.perpDistance(this.joint.pos, tipPos);
    console.log(this.joint.pos, tipPos);
    console.log(dist);
    return dist != -1 && dist <= this.joint.bridge.size / 2;
    // console.log(dist);

}
ExternalForce.prototype.select = function (clear = 0) {
    if (clear) {
        this.joint.bridge.clearSelections();
    }
    this.joint.bridge.selected.extForces.add(this);
    this.selected = true;

}
ExternalForce.prototype.deselect = function () {
    this.joint.bridge.selected.extForces.delete(this);
    this.selected = false;

}
ExternalForce.prototype.remove = function () {
    // removes references to this force from the bridge
    this.joint.bridge.forceJoints.delete(this.joint);
    this.joint.bridge.selected.extForces.delete(this);
    
    // removes references on connected joint
    this.joint.extForces.delete(this);
    
    // no more references to this force should remain, and it will be reclaimed by the garbage collector.
}

ExternalForce.prototype.setDimensions = function(mag, radians) {
    this.mag = mag;
    this.angle = radians
}


// TODO
const Pin = function (joint) {
    this.joint = joint;
    this.horizontal = new Vector(undefined, 0);
    this.vertical = new Vector(undefined, Math.PI / 2);

}

// TODO
const Roller = function (joint) {
    this.joint = joint;
    this.vertical = new Vector(undefined, Math.PI / 2);
}

// TODO
const Joint = function (bridge, pos) {
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
                let x = other.pos.x + (this.pos.x - other.pos.x) / 2;
                let y = other.pos.y + (this.pos.y - other.pos.y) / 2;
                let replacementJoint = new Joint(this.bridge, new Pos(x, y));
                this.bridge.joints.add(replacementJoint);

                // creates new member
                this.bridge.addMember(other, replacementJoint);

            } else {
                member.remove();
            }


        });
        
        // release the joints id so it can be reused again
        this.bridge.ids.release(this.id);

        // removes forces on this joint
        this.extForces.forEach((force) => {
            force.remove();
        });

        // removes pins or rollers
        if (this.pin) {
            delete this.bridge.pin;
        }
        if (this.roller) {
            delete this.bridge.roller;
        }

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
        let radius = (this.bridge.settings.fullCollision ? this.type.radius : 0);
        if (zone instanceof CircleZone) {
            let distX = Math.abs(this.pos.x - zone.x);
            let distY = Math.abs(this.pos.y - zone.y);
            return (distX ** 2 + distY ** 2 <= (zone.radius + radius) ** 2);
        }
        if (zone instanceof RectZone) {
            let distX = Math.abs(this.pos.x - zone.x - zone.w / 2);
            let distY = Math.abs(this.pos.y - zone.y - zone.h / 2);

            if (distX > (zone.w / 2 + radius)) { return false; }
            if (distY > (zone.h / 2 + radius)) { return false; }

            if (distX <= (zone.w / 2)) { return true; }
            if (distY <= (zone.h / 2)) { return true; }

            let dx = distX - zone.w / 2;
            let dy = distY - zone.h / 2;
            return (dx * dx + dy * dy <= (radius * radius));


        }
    }

    this.uncollideWithZone = (zone) => {
        let radius = (this.bridge.settings.fullCollision ? this.type.radius : 0);
        if (zone instanceof CircleZone) {
            //finds how much collision there is 
            let distX = this.pos.x - zone.x;
            let distY = this.pos.y - zone.y;
            let dist = Math.sqrt(distX ** 2 + distY ** 2) - Math.sqrt((zone.radius + radius) ** 2);

            // calculates the angle between
            let angle = Math.atan(distY / distX);

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
            let distX = this.pos.x - zone.x - zone.w / 2;
            let distY = this.pos.y - zone.y - zone.h / 2;

            // if (distX > (zone.w/2 + this.type.radius)) { return false; }
            // if (distY > (zone.h/2 + this.type.radius)) { return false; }
            // console.log(distX, distY);

            if (Math.abs(distX) <= zone.w / 2 || Math.abs(distY) <= zone.h / 2) {
                if (Math.abs(distX) / (zone.w / 2) > Math.abs(distY) / (zone.h / 2)) {
                    if (distX > 0) {
                        this.pos.x += (zone.w / 2 - distX) + radius;
                    }
                    else {
                        this.pos.x -= ((zone.w / 2 + distX) + radius);
                    }
                }
                else {
                    if (distY > 0) {
                        this.pos.y += (zone.h / 2 - distY) + radius;
                    }
                    else {
                        this.pos.y -= ((zone.h / 2 + distY) + radius);
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
            else if (this.bridge.selected.joints.size > 0) {
                this.bridge.selected.joints.forEach((joint) => {
                    //if not already a neighbour
                    if (!this.neighbours.has(joint)) {
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
                this.select(1);

                // signals an the canvas needs to be redrawn
                return 1;

            }
        }
        else {
            return 0;
        }
    }
}

//
const Member = function (bridge, joints) {
    this.force;
    this.bridge = bridge;
    this.material = { type: memberTypes[0], count: 1 };
    this.joints = joints;
    this.thickness = 20;
    this.selected = false;

    this.id = (() => {
        let joints = this.joints.values();
        let joint1 = joints.next().value;
        let joint2 = joints.next().value;
        let id = `${joint1.id}-${joint2.id}`
        return id;
    })();

    // DONE
    this.getLength = () => {
        let joints = Array.from(this.joints.values());
        let len = joints[0].pos.dist(joints[1].pos);
        return len
    }

    this.getAngle = (end) => {
        let origin = this.other(end);
        let pos1 = origin.pos;
        let pos2 = end.pos;
        // the y axis is inverted
        let dy = (pos1.y - pos2.y);
        let dx = (pos2.x - pos1.x);

        let angle = (dx == 0 ?
            (dy > 0 ?
                90:
                270):
            (dx > 0 ? 
                degrees(Math.atan(dy/dx)) : 
                degrees(Math.PI + Math.atan(dy/dx))));
        angle = (angle < 0? 360 + angle: angle)
        return angle;
    }
    this.getAngleStd = () => {
        // finds the joint highest on the page
        let end = this.getHighestJoint()
        return this.getAngle(end);
    }
    this.getHighestJoint = () => {
        return Array.from(this.joints.values()).reduce((prev, cur) => {
            return (cur.pos.y < prev.pos.y ? cur : prev) || cur;
        });
    }
    this.setDimensions = (length, radians, movedJoint) => {
        let fixedJoint = this.other(movedJoint);
        movedJoint.pos.x = fixedJoint.pos.x + length * Math.cos(radians);
        movedJoint.pos.y = fixedJoint.pos.y - length * Math.sin(radians);

    }

    // DONE
    this.other = (joint) => {
        // returns the joint connected to this member on the other end of the provided joint
        let [joint1, joint2] = Array.from(this.joints.values());
        return joint !== joint1 ?
            joint1 :
            joint2;
    }

    // DONE
    this.remove = () => {
        /* 
        ? deletes the reference to the member (between the two joints) from each joints members array and the bridge object.
        ? JS's garbage collector will then reclaim this object as no references will remain.
        */

        // removes references to this member from the parent bridge
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
        let dist = this.bridge.mouse.perpDistance(...Array.from(this.joints).map((joint) => { return joint.pos; }));
        return dist != -1 && dist <= this.thickness / 2;
        // console.log(dist);

    }

    // DONE
    this.select = (clear = 0) => {
        if (clear) {
            this.bridge.clearSelections();
        }
        this.selected = true;
        this.bridge.selected.members.add(this);
        
        document.querySelector(`#${this.id}`).setAttribute("selected", "");
    }

    // DONE
    this.deselect = () => {
        this.bridge.selected.members.delete(this);
        this.selected = false;

        document.querySelector(`#${this.id}`).removeAttribute("selected");
    }

    this.center = () => {
        let [joint1, joint2] = Array.from(this.joints.values());
        let x = (joint1.pos.x + joint2.pos.x) / 2;
        let y = (joint1.pos.y + joint2.pos.y) / 2;
        return new Pos(x, y);

    }

    this.cap = (safetyFactor) => {
        if (this.force > 0) {
            return this.material.type.tension(this.getLength(), safetyFactor) * this.material.count;
        }
        else {
            return this.material.type.compression(this.getLength(), safetyFactor) * this.material.count;
        }
    }

    // TODO
    this.rebase = () => {
        // deletes this member and creates a replacement member with different joints and a new React id but with the same material properties.


    }

    // DONE
    this.safetyFactor = () => {
        return Math.abs(this.cap(this.bridge.safetyFactor)/this.force);
    }

    // DONE
    this.cost = () => {
        // the cost of a member group depends on which type used is between the member's joints and how many
        // NOTE there should be an option to for the user to pass these prices in via the GUI.  
        if (this.getLength() <= 90) {
            let cost = this.material.type.cost.short * this.material.count
            return cost;
        }
        else {
            let cost = this.material.type.cost.long * this.material.count;
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
            event.shiftKey ?
                (this.selected ?
                    this.deselect() :
                    this.select()
                ):
                // else clear selection first
                this.select(1);

            return 1;
        }
        else {
            return 0;
        }
    }


};

export const Bridge = function (canvasManager, mouse) {
    this.CM = canvasManager;
    this.domContainer = document.querySelector('tbody');

    this.mouse = mouse;
    this.mouse.dragging = false;
    this.settings = {
        replaceJoint: false,
        showLengths: true,
        showAngles: true,
        fontSize: 15,
        showLabels: true
    };
    this.ids = new IdGenerator();
    this.UI = {
        determinancy: document.querySelector("#determinancy"),
        lengthInput: document.querySelector("#length"),
        angleInput: document.querySelector("#angle"),
        typeSelector: document.querySelector("#member-type"),
        countSelector: document.querySelector("#member-count"),
        btns: {
            forceBtn: document.querySelector("#force-btn"),
            pinBtn: document.querySelector("#pin-btn"),
            rollerBtn: document.querySelector("#roller-btn"),
            forcesBtn: document.querySelector("#forces-btn"),
            lengthsBtn: document.querySelector("#lengths-btn"),
            anglesBtn: document.querySelector("#angles-btn"),
            labelsBtn: document.querySelector("#labels-btn"),
            replaceJointsBtn: document.querySelector("#replace-joints-btn")
        }
    }
    this.inputEntity;

    this.size = 10;
    this.members = new Set();
    this.joints = new Set();
    this.selected = {
        joints: new Set(),
        members: new Set(),
        extForces: new Set()
    }
    this.forceJoints = new Set();
    this.pin;
    this.roller;
    this.safetyFactor = 0.8;
    this.singleCapacity = 230;



    this.domContainer = document.querySelector('tbody');

    this.init = (canvas) => {
        // click event for canvas
        canvas.addEventListener("click", this.handleClick);
        canvas.addEventListener("mousedown", this.handleMouseDown);
        canvas.addEventListener("mousemove", this.handleMouseMove);
        canvas.addEventListener("mouseup", this.handleMouseUp);
        canvas.addEventListener("mouseup", this.handleMouseUp);

        this.UI.btns.forcesBtn.addEventListener("click", () => {
            this.settings.showForces = (this.settings.showForces ? false : true);
            this.draw();
        });

        this.UI.btns.lengthsBtn.addEventListener("click", () => {
            this.settings.showLengths = (this.settings.showLengths ? false : true);
            this.draw();
        });

        this.UI.btns.anglesBtn.addEventListener("click", () => {
            this.settings.showAngles = (this.settings.showAngles ? false : true);
            this.draw();
        });

        this.UI.btns.labelsBtn.addEventListener("click", () => {
            this.settings.showLabels = (this.settings.showLabels ? false : true);
            this.draw();
        });

        this.UI.btns.replaceJointsBtn.addEventListener("click", () => {
            this.settings.replaceJoint = (this.settings.replaceJoint ? false : true);
            this.draw();
        });

        this.UI.btns.forceBtn.addEventListener("click", ()=>this.addExtForce());

        this.UI.btns.pinBtn.addEventListener("click", this.setPin);

        this.UI.btns.rollerBtn.addEventListener("click", this.setRoller);

        this.UI.typeSelector.addEventListener("change", this.setMemberMaterial);
        
        this.UI.countSelector.addEventListener("change", this.setMemberMaterial);




        // workaround for making keydown events work for canvas
        var lastDownTarget
        /* For mouse event */
        document.addEventListener('mousedown', (event) => {
            lastDownTarget = event.target;
        }, false);

        /* For keyboard event */
        document.addEventListener('keydown', (event) => {
            if (lastDownTarget == canvas) {
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
            return entity.isMouseOver(this.mouse);
        });


        // if no hits then add a circle
        // if hit then set the isDown flag to start a drag
        if (hit) {
            console.log(hit);
            this.mouse.dragging = true;
        } else {
            console.log("No Selected Joint At Cursor");
        }
    }

    this.handleMouseMove = (e) => {
        // if we're not dragging, just exit
        if (!this.mouse.dragging) { return; }

        this.mouse.dragged = true;

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


        // returns an array of all the joints on selected members (including double-ups)
        let jointsOnSelectedMembers = Array.from(this.selected.members.values()).reduce((prev, cur) => [...prev, ...cur.joints], []);

        // returns an array of all joints with selected forces on them
        let jointsWithSelectedForces = Array.from(this.selected.extForces.values()).reduce((arr, force) => {
            return [...arr, force.joint]
        }, []);

        // collects all joints associated with a selected entity
        let selectedJoints = new Set([...jointsWithSelectedForces, ...jointsOnSelectedMembers, ...this.selected.joints]);

        // handles collisions between collected joints and zones
        selectedJoints.forEach((joint) => {
            // change the  position of the joints by the distance the mouse has moved since the last mousemove event
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

        if (this.mouse.dragged) {
            this.update();
        }
    }

    // TODO - event handler to be set up
    this.handleClick = (event) => {

        // returns if dragging occured
        if (this.mouse.dragged) {
            this.mouse.dragged = false;
            return
        }

        // gets all the external forces on joints
        let forces = Array.from(this.forceJoints.values()).reduce((arr, joint) => [...arr, ...joint.extForces], []);

        // runs handleClick on every entity 
        console.log("clicked");
        let entityClicked = [...forces, ...this.joints, ...this.members].find((entity) => {
            return entity.handleClick(event, this.mouse);
        });
        console.log("Selected Entities: " , this.selected);

        console.log("clicked on: ", entityClicked ? entityClicked : "The Canvas");

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
        this.updateDimensionInputs();
    }

    // DONE
    this.setPin = () => {
        // only one joint can be made a pin
        if (this.selected.joints.size > 1) {
            return;
        }
        let joint = this.selected.joints.values().next().value;
        if (this.pin) {
            // remove pin reference on old joint 
            let oldJoint = this.pin.joint;
            delete oldJoint.pin;

            // adds reference to the new joint on the pin
            this.pin.joint = joint;
        }
        else {
            this.pin = new Pin(joint);
        }
        // add pin reference to new joint
        joint.pin = this.pin;

        //updates the view
        this.update();
    }

    // DONE
    this.setRoller = () => {
        if (this.selected.joints.size > 1) {

        }
        let joint = this.selected.joints.values().next().value;
        if (this.roller) {
            // remove roller reference on old joint 
            let oldJoint = this.roller.joint;
            delete oldJoint.roller;

            // adds reference to the new joint on the roller
            this.roller.joint = joint;
        }
        else {
            this.roller = new Roller(joint);
        }
        // add roller reference to new joint
        joint.roller = this.roller;

        //updates the view
        this.update();
    }

    // DONE
    this.isDeterminant = () => {
        return this.pin != undefined && this.roller != undefined && this.members.size == (this.joints.size * 2 - 3);
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
    this.addExtForce = (mag = 300, radians = Math.PI*3/2) => {
        this.selected.joints.forEach((joint) => {
            // adds a force to the joints set
            joint.extForces.add(new ExternalForce(joint, mag, radians));
            // adds the joint to the bridges set
            this.forceJoints.add(joint);

            console.log(joint.extForces);
        })
        //updates the view
        this.update();
    }

    // TODO
    this.removeExtForce = () => {

    }

    // DONE
    this.removeSelected = () => {
        //removing members (leaves joints unremoved)
        this.selected.members.forEach((member) => {
            this.removeMember(member);
        });
        //removing joints
        this.selected.joints.forEach((joint) => {
            this.removeJoint(joint);
        });
        //removing forces 
        this.selected.extForces.forEach((force) => {
            this.removeForce(force);
        });

        this.update();
        this.updateDimensionInputs();
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

    // DONE
    this.removeForce = (force) => {
        // delegates the removing to the joint
        force.remove();
    }

    this.updateMemberDimensions = (event) => {
        let member = this.selected.members.values().next().value;
        let movedJoint = this.selected.joints.values().next().value;

        let length = this.UI.lengthInput.value;
        let angle = this.UI.angleInput.value;
        member.setDimensions(length, radians(angle), movedJoint);
        console.log("DIMENSIONS UPDATED");
        console.log(member);
        this.draw();
    }

    // DONE
    this.updateForceDimensions = () => {
        let force = this.selected.extForces.values().next().value;
        let mag = this.UI.lengthInput.value;
        let angle = this.UI.angleInput.value;

        force.setDimensions(mag, radians(angle));
        console.log("DIMENSIONS UPDATED");
        console.log(force);
        this.draw();

    }



    // TODO
    this.updateDimensionInputs = () => {
        // counts the number of each entity is selected
        let numforces = this.selected.extForces.size;
        let numMembers = this.selected.members.size;
        let numJoints = this.selected.joints.size;

        // if a single member and joint is selected
        if (numforces == 0 && numMembers == 1 && numJoints == 1 && this.selected.members.values().next().value.joints.has(this.selected.joints.values().next().value)) {

            console.log("YO! YOU CAN UPDATE MY LENGTH!");
            
            let member = this.selected.members.values().next().value;
            let movedJoint = this.selected.joints.values().next().value;


            console.log(member);
            // sets the values of the input elements to that of the selected member 
            this.UI.lengthInput.value = member.getLength();
            this.UI.angleInput.value = member.getAngle(movedJoint);

            // Add oninput events to the inputs elements
            this.UI.lengthInput.removeAttribute("disabled");
            this.UI.lengthInput.addEventListener("input", this.updateMemberDimensions);

            this.UI.angleInput.removeAttribute("disabled");
            this.UI.angleInput.addEventListener("input", this.updateMemberDimensions);
        }
        else if (numforces == 1 && numJoints == 0 && numMembers == 0) {
            console.log("HEY! YOU CAN UPDATE MY MAGNITUDE AND ANGLE!");
            let force = this.selected.extForces.values().next().value;
            
            this.UI.lengthInput.value = force.mag;
            this.UI.angleInput.value = degrees(force.angle);
            
            // Add on input events to the input elements
            this.UI.lengthInput.removeAttribute("disabled");
            this.UI.lengthInput.addEventListener("input", this.updateForceDimensions);

            this.UI.angleInput.removeAttribute("disabled");
            this.UI.angleInput.addEventListener("input", this.updateForceDimensions);

        }
        // else clear the inputs if they haven't been already
        else if (this.UI.lengthInput.value || this.UI.angleInput.value) {

            // removes the event listeners
            this.UI.lengthInput.removeEventListener("input", this.updateMemberDimensions);
            this.UI.angleInput.removeEventListener("input", this.updateMemberDimensions);

            // resets the value
            this.UI.lengthInput.value = "";
            this.UI.angleInput.value = "";

            // disables the inputs
            this.UI.lengthInput.setAttribute("disabled", "");
            this.UI.angleInput.setAttribute("disabled", "");
        }
        // member type selection
        if (this.selected.members.size > 0) {
            this.UI.typeSelector.removeAttribute("disabled");
            this.UI.countSelector.removeAttribute("disabled");
            
            // figures out what to display in the type selection
            let membersArr = Array.from(this.selected.members);
            let allEqual = membersArr.every((member) => {
                return member.material.type.id == membersArr[0].material.type.id;
            })
            // if members have different types then display the blank option
            this.UI.typeSelector.value = (allEqual ? membersArr[0].material.type.id : -1);  

            //figures out what to display in count selection       
            allEqual = membersArr.every((member) => {
                return member.material.count == membersArr[0].material.count;
            })
            // if members have different types then display the blank option
            this.UI.countSelector.value = (allEqual ? membersArr[0].material.count : -1);            
        }
        else {
            this.UI.typeSelector.setAttribute("disabled", "");
            this.UI.countSelector.setAttribute("disabled", "");
            this.UI.typeSelector.value = -1;
            this.UI.countSelector.value = -1;

        }
    }

    // DONE
    this.setMemberMaterial = (event) => {
        if (event.target.value == -1) {
            return;
        }
        let selectedMembers = this.selected.members;
        console.log(event);
        if (selectedMembers.size > 0) {
            selectedMembers.forEach((member) => {
                member.material.type = (this.UI.typeSelector.value == -1 ? member.material.type : memberTypes[this.UI.typeSelector.value]);
                member.material.count = (this.UI.countSelector.value == -1 ? member.material.count : this.UI.countSelector.value);
                console.log(member);
            });
            this.update();
        }
    }

    // DONE
    this.clearSelections = () => {
        this.selected.joints.forEach(entity => {
            entity.deselect();
        });
        this.selected.members.forEach(entity => {
            entity.deselect();
        });
        this.selected.extForces.forEach(entity => {
            entity.deselect();
        });
        this.draw();
        this.updateDimensionInputs();
    }

    // DONE
    this.verifyLoad = (joint) => {
        return zones.loadingZone.some((zone) => {
            return joint.collideWithZone(zone);
        });
    }

    // DONE
    this.calcReactions = () => {
        if (this.pin == undefined || this.roller == undefined) {
            return false;
        }
        console.log("This bridge can have it's reaction forces calculated :)")

        console.log(this.pin); 

        let forces = Array.from(this.forceJoints).reduce((arr, joint) => {
            return [...arr, ...joint.extForces];
        }, []);

        console.log("Forces being considered in calc: ", forces);

        // * Solving the vertical force on the roller 
        let momentsAboutPin = forces.map((force) => {
            //calculates the moment caused by each force about the pin
            let dx = force.joint.pos.x - this.pin.joint.pos.x;
            let dy = force.joint.pos.y - this.pin.joint.pos.y;

            let Fv = force.mag * Math.sin(force.angle);
            let Fh = force.mag * Math.cos(force.angle);

            return Fv * dx + Fh * dy;
        });

        let sumOfForceMoments = momentsAboutPin.reduce((prev, cur) => prev + cur, 0);
        let rollerDX = (this.roller.joint.pos.x - this.pin.joint.pos.x); 
        
        // such that sum of moments around the pin is 0
        this.roller.vertical.mag = - sumOfForceMoments/rollerDX;

        // * solving the horizontal force on the pin
        let horizontalForces = forces.map((force) => {
            return force.mag * Math.cos(force.angle);
        }).reduce((prev, cur) => {
            return prev + cur;
        }, 0);

        this.pin.horizontal.mag = -horizontalForces;

        // * solving the vertical force on the pin
        let verticalForces = forces.map((force) => {
            return force.mag * Math.sin(force.angle);
        }).reduce((prev, cur) => {
            return prev + cur;
        }, 0);

        this.pin.vertical.mag = 
        -this.roller.vertical.mag - verticalForces;

        console.log(this.pin, this.roller);

        // if the function gets to this point it should have successfully calculated and set the reaction forces on the pin and roller
        return true;
    }

    // TODO 
    this.calc = () => {
        return new Promise((resolve) => {

            // returns false if the bridge is not determinant
            if (!this.isDeterminant()) {
                this.UI.determinancy.innerText = "Indeterminant";
                // resolve(false);
                // return;
            }
            else {
                this.UI.determinancy.innerText = "Determinant";
            }

            // deletes

            // calculates reaction forces at pin and roller
            if (!this.calcReactions()) {
                console.log("%cReaction locations not fully defined!", "background: rgb(173, 169, 168);color: rgb(156, 16, 0)");
                resolve(false);
                return;
            }
            
            this.stress().then((result) => {
                // calculates the stress in each member
                console.log(result);
                if (!result) {
                    console.log("Couldn't calculate member stresses");
                }
                resolve(result);
            })
        });
    }

    this.functionFactory = (joint, unknown, knownMembers, extForces) => {
        return {
            // Sum of forces X
            SumFx: (X) => {
                return 0 +
                unknown.reduce((sum, curMember, i) => {
                    return sum + X[i] * Math.cos(radians(curMember.getAngle(curMember.other(joint))));
                }, 0) +
                knownMembers.reduce((sum, curMember) => {
                    return sum + curMember.force * Math.cos(radians(curMember.getAngle(curMember.other(joint))));
                }, 0) +
                extForces.reduce((sum, curForce) => {
                    return sum + curForce.mag * Math.cos(curForce.angle);
                }, 0);
                
            },
            // Sum of forces Y
            SumFy: (Y) => {
                return 0 +
                unknown.reduce((sum, curMember, i) => {
                    return sum + Y[i] * Math.sin(radians(curMember.getAngle(curMember.other(joint))));
                }, 0) +
                knownMembers.reduce((sum, curMember) => {
                    return sum + curMember.force * Math.sin(radians(curMember.getAngle(curMember.other(joint))));
                }, 0) +
                extForces.reduce((sum, curForce) => {
                    return sum + curForce.mag * Math.sin(curForce.angle);
                }, 0);

            }
        }
    }

    // TODO
    this.solveLoads = (joint) => {
        return new Promise((resolve, reject) => {
            // calculates the unknown loads on each member connected to this joint
            // (maximum 2 unknown forces)
            
            // collects all external forces associated with this joint
            let extForces = Array.from(joint.extForces.values());
            if (joint.pin) {extForces.push(joint.pin.horizontal); extForces.push(joint.pin.vertical);}
            if (joint.roller) {extForces.push(joint.roller.vertical)}
            
            // collects all unknown force members
            let unknownMembers = [...joint.members].filter((member) => {
                return member.force == undefined;
            });
        
            // collects all known force members
            let knownMembers = [...joint.members].filter((member) => {
                return member.force != undefined;
            })
        
            console.log("Equation parameters:", unknownMembers, knownMembers, extForces);
            let {SumFx, SumFy} = this.functionFactory(joint, unknownMembers, knownMembers, extForces);
            
            
            let solver = new Ceres();
            //Add the Sum forces X equation to the solver.
            solver.add_function(SumFx);
            //Add the Sum forces Y equation to the solver.
            solver.add_function(SumFy);
            
            solver.promise.then(() => { 
                var x_guess = [1,2] //Guess the initial values of the solution.
                var s = solver.solve(x_guess, undefined, 1e-15) //Solve the equation
                var x = s.x //assign the calculated solution array to the variable x
                console.log(`%c${x}`, "background: rgb(202, 202, 202) ; color: rgb(12, 86, 166)");
                console.log(joint);
                // console.log(s.report); //Print solver report
                solver.remove(); //required to free the memory in C++

                unknownMembers.forEach((member, i) => {
                    member.force = x[i];
                })
                resolve();
            });
            
            
            
        });
    }

    this.recurseStress = (jointsArr, loopCount) => {
        return new Promise((resolve)=>{
            
            loopCount ++;
            // loops until ever member has had their force updated 
            if (Array.from(this.members).some((member) => member.force == undefined) && loopCount <= 1000) {
                // find a joint with 2 or less unknown forces
                let index = jointsArr.indexOf((joint) => {
                    // filters members to those that have unknown forces
                    return Array.from(joint.members).filter((member) => {
                        member.force == undefined;
                    }).length <= 2; 
                })
                let joint = jointsArr.splice(index, 1)[0];
                if (joint) {
                    this.solveLoads(joint).then(() => {
                        this.recurseStress(jointsArr, loopCount).then((result) => {
                            resolve(result);
                        });
                    });
                    console.log("Test!");
                } 
                //if there are members without forces but no solvable joints then return false 
                else {
                    resolve(false);
                }
            } else {resolve(true)}
        });
    }

    // TODO (optimise later)
    this.stress = () => {
        return new Promise((resolve) => {
            
            // unsets the force property on each member
            this.members.forEach((member) => {
                member.force = undefined; 
            });
            // resolve(false);
            // return;
            
            let joitsArr = Array.from(this.joints);
            let loopCount = 0;
            
            this.recurseStress(joitsArr, loopCount).then((result) => {
                console.log("Stress Promise: ", result);
                resolve(result);
            })
        });
    }

    // TODO - Testing required
    this.cost = () => {
        // calcutes total cost (runs cost methods on each bridge entity)
        return [...this.members, ...this.joints].reduce((total, cur) => total + cur.cost(), 0);
    }

    // TODO
    this.update = async () => {
        // TODO
        // * calculates member capacities and total capacity component
        let solved = await this.calc();
        console.log(solved);

        // TODO
        // * deteminancy notification
        if (solved) {
            console.log("stress updated");
        }
        else {
            console.log("failed to update stress");
        }

        // DONE
        // * updates the costs component
        document.querySelector("#total-cost").innerText = this.cost();

        // DONE
        // * updates the members table component

        let memberTable = MemberTable({ members: this.members });
        ReactDOM.render(memberTable, this.domContainer);


        // *draws the canvas
        this.draw();

        // adjust the size of components
        document.querySelector("#UI").style.gridTemplateRows = "auto min-content";


        // ReactDOM.render(memberTable, domContainer);




    }

    // DONE
    this.displayLength = (member) => {
        // Display member lengths as text on the canvas
        let memberCenter = member.center();

        this.CM.ctx.font = `bolder ${this.settings.fontSize}px Arial`;
        this.CM.ctx.textAlign = "center";

        this.CM.ctx.fillStyle = "rgb(0,0,0)";
        this.CM.ctx.fillText(member.getLength().toFixed(2) + " mm", memberCenter.x, memberCenter.y);
    }

    // DONE (almost)
    this.draw = () => {
        this.CM.clear();


        // DONE
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


        // DONE
        // draws pins and rollers
        if (this.roller != undefined) {
            this.CM.roller(this.roller.joint.pos.x, this.roller.joint.pos.y, neutralColor.rgb(), this.size, -Math.PI / 2);
        }
        if (this.pin != undefined) {
            this.CM.pin(this.pin.joint.pos.x, this.pin.joint.pos.y, neutralColor.rgb(), this.size, -Math.PI / 2);
        }


        // TODO
        // recalculates all forces
        // this.stress();

        // DONE
        // draws all members
        this.members.forEach((member) => {

            // member capacity
            let [joint1, joint2] = Array.from(member.joints.values());
            let percentage = Math.min(Math.abs(member.force||0 / member.cap(this.safetyFactor)), 1);


            //member color
            let forceColor = Object.assign(member.force <= 0 ? compressionColor : tensionColor);
            let maxLength = (member.force <= 0 ? 159: 151);
            // console.log("Is force greater than capacity?", Math.abs(member.force) > member.cap(this.safetyFactor), "Force", member.force, "capacity", member.cap(this.safetyFactor), "PERCENTAGE", percentage);
            let color = (
                member.getLength() >= maxLength || Math.abs(member.force) > member.cap(this.safetyFactor) ? 
                invalidColor:
                new Color().lerp(neutralColor, forceColor, percentage)
            );

            // console.log(color);

            // selection glow
            let selected = this.selected.members.has(member);
            if (selected) {

                this.CM.ctx.shadowBlur = 20;
                this.CM.ctx.shadowColor = selectedColor.rgb();
                this.CM.ctx.fillStyle = selectedColor.rgb();
                this.CM.line(joint1.pos.x, joint1.pos.y, joint2.pos.x, joint2.pos.y, selectedColor.rgb(), this.size * 1.2);
                this.CM.ctx.shadowBlur = 0;

            }

            // Draws the member as a line between its joints
            this.CM.line(joint1.pos.x, joint1.pos.y, joint2.pos.x, joint2.pos.y, color.rgb(), this.size);



        });

        // DONE
        // draws all joints
        this.joints.forEach((joint) => {
            let color = (this.selected.joints.has(joint) ? selectedColor : jointColor)
            this.CM.circle(joint.pos.x, joint.pos.y, joint.type.radius, color.rgb())
        });


        // DONE
        //draws all forces
        this.forceJoints.forEach((joint) => {
            let x = joint.pos.x //+ force.vector.mag * Math.cos(force.vector.angle);
            let y = joint.pos.y //+ force.vector.mag * Math.sin(force.vector.angle);



            let isValidLoad = this.verifyLoad(joint);
            (isValidLoad ? this.load = joint : delete this.load);

            let color = (isValidLoad ? loadColor : forceColor);
            // checks if force is in a loading zone
            joint.extForces.forEach((force) => {

                // adds glow if selected
                let selected = this.selected.extForces.has(force);
                if (selected) {
                    let tipPos = force.tipPos();
                    this.CM.ctx.shadowBlur = 10;
                    this.CM.ctx.shadowColor = selectedColor.rgb();
                    this.CM.ctx.fillStyle = selectedColor.rgba();
                    this.CM.arrow(x, y, force.mag / 10 + 2, force.angle, selectedColor.rgb(), this.size + 4);

                }


                this.CM.arrow(x, y, force.mag / 10, force.angle, color.rgb(), this.size);
                this.CM.ctx.shadowBlur = 0;

                

            })
        });

        // DONE
        // * Loops again for all the text
        // joints
        if (this.settings.showLabels) {
            this.joints.forEach((joint) => {
                // Text
                let x = joint.pos.x - 20;
                let y = joint.pos.y - 20;

                this.CM.ctx.font = `bolder ${this.settings.fontSize}px Arial`;
                this.CM.ctx.textAlign = "center";

                this.CM.ctx.fillStyle = labelColor.rgb();
                this.CM.ctx.fillText(joint.id, x, y);
                    
            });
        }
        // forces
        if (this.settings.showForces) {
            this.forceJoints.forEach((joint) => {
                let x = joint.pos.x //+ force.vector.mag * Math.cos(force.vector.angle);
                let y = joint.pos.y 
                joint.extForces.forEach((force) => {
                    //text
                    this.CM.ctx.fillText(`${force.mag} N`, joint.pos.x + force.mag/10 * Math.cos(force.angle), joint.pos.y + (force.mag/10 * Math.sin(-force.angle)) + this.size);

                });
            });
        }
        // members
        // counts the number of angles about each joint
        let crowdCount = new Map();
        this.members.forEach((member) => {
            let selected = this.selected.members.has(member);
            // text
            if (this.settings.showLengths || selected) {
                this.displayLength(member);
            }
            // angles
            let hasSelectedJoint = Array.from(this.selected.joints).some((joint) => {
                return member.joints.has(joint);
            })
            // show all angles of selected geometry
            if (this.settings.showAngles && (selected || hasSelectedJoint)) {
                

                let angle = member.getAngleStd();
                let origin = member.other(member.getHighestJoint());

                // (I'm very proud of this counter)
                crowdCount.set(origin,(crowdCount.has(origin) ? crowdCount.get(origin) + 1 : 1));

                // angle symbol and text
                this.CM.ctx.beginPath();
                this.CM.ctx.moveTo(origin.pos.x, origin.pos.y);
                this.CM.ctx.lineTo(origin.pos.x + this.size*3*crowdCount.get(origin) + this.size*0.5, origin.pos.y);
                this.CM.ctx.arc(origin.pos.x, origin.pos.y, this.size *3*crowdCount.get(origin), 0, -radians(angle), true)
                this.CM.ctx.strokeStyle = "rgb(0,0,0)";
                this.CM.ctx.lineWidth = 2;
                this.CM.ctx.stroke();
                this.CM.ctx.fillText(`${angle.toFixed(0)}°`, origin.pos.x +  this.size *3 * crowdCount.get(origin), origin.pos.y + this.size *1.5);
            }
        });
    }


    // TODO
    this.save = () => {
        // creates a encoded string containing enough information about the current bridge to load it again.

    }

    // TODO

    this.load = () => {
        // creates a bridge from an encoded string.

    }
};



