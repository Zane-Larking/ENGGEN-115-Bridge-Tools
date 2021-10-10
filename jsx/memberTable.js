
'use strict';
function MemberRow(member){
    console.log(member);
    return (
        <tr key={member.id}>
            <td>{`${member.id}`}</td>
            <td>{`${member.force} N`}</td>
            <td>{(member.force < 0 ? "Compression": "Tension")}</td>
            <td>{`${member.cap(member.bridge.safetyFactor).toFixed(2)} N`}</td>
            <td>{`$${member.cost()}`}</td>
            <td>{`${member.cap(member.bridge.safetyFactor)/member.force}`}</td>
        </tr>
    );
}

// console.log(bridge);
function MemberTableFactory(members) {
    class MemberTable extends React.Component {
        constructor(props) {
            super(props);
            this.state = { liked: false };
        }

        render() {
            let rows = [];
            console.log(members);
            members.forEach((member) => {
                console.log(member);
                rows.push(MemberRow(member));
            })
                
            return (
                    rows
            );
        }
    }
    return MemberTable;
}

console.log(MemberTableFactory);
export {MemberTableFactory};

