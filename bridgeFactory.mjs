// import canvasManagerFactory from './canvasManager.mjs';


function Pos(x,y) {
    return {
        x: x,
        y: y
    }
}

function Joint(pos) {
    return {
        pos: pos,
        
        neighbours: [],
        members: [],
        
        addNeighbour: (joint) => {
            if (neighbours.includes(joint)) {
                return;
            }
            this.neighbours.push(joint);
        },
        removeNeighbour: (joint) => {
            this.neighbours = this.neighbours.filter((x) => {return x != joint});
        },
        
        cost: () => {
            return this.members.length;
        },
        
        from: (arg) => {
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
        },
        
    };
}
    
//
function Member(joints , load, type) {
    this.force;
    this.load = load;
    this.joints = joints;

}

function bridgeFactory() {

    members = [];
    joints = [];

    return{
        members: members,
        joints: joints,
        addMember: (...args) => {
            for ([arg, i]  of args) {
                if (i < args.length-1) {
                    joint = Joint.from(arg);
                    this.joints.push(joint);
                }
            }
    
        },    
        cost: () => {
            return [this.members, this.joints].reduce((total, cur) => total + cur.cost(), 0);
        }

    }
    

}


bridge = bridgeFactory();
console.log(bridge);
bridge.addMember([Pos()])

exports = {bridgeFactory: bridgeFactory};