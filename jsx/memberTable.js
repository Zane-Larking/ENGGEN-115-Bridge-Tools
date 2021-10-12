'use strict';
function MemberRow(props){
    let member = props.member;
    return (
        <tr id={member.id}key={member.id}>
            <td key={`${member.id}-id`}>{`${member.id}`}</td>
            <td key={`${member.id}-angle`}>{`${member.getAngle(Array.from(member.joints.values()).reduce((prev, cur) => {
                return cur.pos.y < prev.pos.y ? cur : prev;
            }), {y:0}).toFixed(2)}°`}</td>
            <td key={`${member.id}-length`}>{`${member.getLength().toFixed(2)} mm`}</td>
            <td key={`${member.id}-force`}>{`${Math.abs(member.force).toFixed(3)} N`}</td>
            <td key={`${member.id}-force-type`}>{(member.force < 0 ? "Compression": "Tension")}</td>
            <td key={`${member.id}-member-type`}>{`${(member.material.count > 1 ? `${member.material.count} x ` : "")}${member.material.type.name}`}</td>
            <td key={`${member.id}-capacity`}>{`${member.cap(member.bridge.safetyFactor).toFixed(3)} N`}</td>
            <td key={`${member.id}-cost`}>{`$${member.cost()}`}</td>
            <td key={`${member.id}-safety-factor`}>{`${member.safetyFactor() < 10000 ?  member.safetyFactor().toFixed(3) : "infinite"}`}</td>
        </tr>
    );
}
function MemberTable(props) {
    return (
        Array.from(props.members.values()).map((member) => {
            return <MemberRow member={member}/>
        })
    )
} 

export {MemberTable};