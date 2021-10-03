// import canvasManagerFactory from './canvasManager.mjs';

// DONE
const Pos = function(x,y) {
    this.x = x;
    this.y = y;
}

// TODO
const Joint = function(pos) {
    this.pos = pos;

    this.neighbours = [];
    this.members = [];

    // DONE
    this.addNeighbour = (joint) => {
        if (this.neighbours.includes(joints) || this == joint) {
            return;
        }
        this.neighbours.push(joint);
        let member = new Member(this, joint, -1);
        this.member.push(member);
    } 
    // TODO
    this.removeNeighbour = (joint) => {
        // for (let i in this.members) {
        //     if (members[i].joints.includes(joint)) {
        //         delete this.members[i];
        //     }
        // }
        // for (let i in )
        //     if (members[i].joints.includes(joint)) {
        //         delete this.members[i];
        //     }

        this.neighbours = this.neighbours.filter((x) => {
            return x != joint
        });
    }

    // TODO
    this.cost = () => {
        return this.members.length;
    }

    // TODO
    this.from = (arg) => {
        // if arg is a Joint
        if (arg.constructor == Joint) {
            return arg;
        }
        // if arg is a Pos
        else if (arg.constructor == Pos) {
            return new Joint(arg);
        }
        else {
            console.log("Attention: Joint parameter is invalid");
        }
    }

}

//
const Member = function(bridge, joints, load, type) {
    this.force;
    this.load = load;
    this.joints = joints;

    this.delete = () => {
        /* 
        ? deletes the reference to the member (between the two joints) from each joints members array and the bridge object.
        ? JS's garbage collector will then reclaim this object as no references will remain.
        */

        //loops over each joint this member is connected to
        this.joints.forEach(joint => {
            //finds and deletes the reference to this member in joint.
            joint.members.forEach((member, index) => {
                if (this == member) {
                    delete joint.members[index];
                }
            });
        });
    }

}

const Bridge = function() {

    this.members = [];
    this.joints = [];
    this.selected = {
        joints: [],
        members: []
    }

    this.addJoint = (...args) => {
        // Is called when there are selected joints and the user left clicks the canvas (not on a joint) 
        for (let value of args) {
            console.log(value);
            console.log(args.length);

            joint = new Joint(arg);
            for (selectedJoint of this.selected.joints){
                joint.addNeighbour(selectedJoint); 
            }
            this.joints.push(joint);
            console.log(this)
            
        }

    }
    this.addMember = () => {
        // Is called when there are selected joints and the user left clicks on a joint.
    }

    this.cost = () => {
        return [this.members, this.joints].reduce((total, cur) => total + cur.cost(), 0);
    }

}

bridge = new Bridge();
console.log(bridge);
bridge.addJoint(new Pos(100,100));

console.log(bridge);

exports = {Bridge: Bridge};