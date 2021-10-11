'use strict';
function MemberRow(props){
    let member = props.member;
    return (
        <tr key={member.id}>
            <td>{`${member.id}`}</td>
            <td>{`${member.force} N`}</td>
            <td>{`${member.len().toFixed(2)} mm`}</td>
            <td>{(member.force < 0 ? "Compression": "Tension")}</td>
            <td>{`${member.cap(member.bridge.safetyFactor).toFixed(2)} N`}</td>
            <td>{`$${member.cost()}`}</td>
            <td>{`${member.cap(member.bridge.safetyFactor)/member.force}`}</td>
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