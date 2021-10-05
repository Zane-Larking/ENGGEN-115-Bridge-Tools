
'use strict';
function MemberRow(member){
    return (
        <tr key={member.id}>
            <td>{member.id}</td>
            <td>{member.force}</td>
            <td>{(member.force < 0 ? "compression": "tension")}</td>
            <td>{member.cap()}</td>
            <td>{member.cost()}</td>
            <td>{member.force/member.cap()}</td>
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

