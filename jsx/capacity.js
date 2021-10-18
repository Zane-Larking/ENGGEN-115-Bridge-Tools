'use strict';
function Capacity(props) {
    return (
        <div>
            <h2>Overall Maximum Capacity: {props.cap.toFixed(2)}</h2>
            <p>{props.brokenMember} breaks under {props.forceType} at {props.force.toFixed(2)} N</p>
        </div>
    )
} 

export {Capacity};