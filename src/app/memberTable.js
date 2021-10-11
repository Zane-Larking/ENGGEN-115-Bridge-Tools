'use strict';

function MemberRow(props) {
    var member = props.member;
    return React.createElement(
        "tr",
        { key: member.id },
        React.createElement(
            "td",
            null,
            "" + member.id
        ),
        React.createElement(
            "td",
            null,
            member.force + " N"
        ),
        React.createElement(
            "td",
            null,
            member.len().toFixed(2) + " mm"
        ),
        React.createElement(
            "td",
            null,
            member.force < 0 ? "Compression" : "Tension"
        ),
        React.createElement(
            "td",
            null,
            member.cap(member.bridge.safetyFactor).toFixed(2) + " N"
        ),
        React.createElement(
            "td",
            null,
            "$" + member.cost()
        ),
        React.createElement(
            "td",
            null,
            "" + member.cap(member.bridge.safetyFactor) / member.force
        )
    );
}
function MemberTable(props) {

    return Array.from(props.members.values()).map(function (member) {
        return React.createElement(MemberRow, { member: member });
    });
}

export { MemberTable };