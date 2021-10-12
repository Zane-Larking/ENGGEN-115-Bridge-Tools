'use strict';

function MemberRow(props) {
    var member = props.member;
    return React.createElement(
        "tr",
        { id: member.id, key: member.id },
        React.createElement(
            "td",
            { key: member.id + "-id" },
            "" + member.id
        ),
        React.createElement(
            "td",
            { key: member.id + "-angle" },
            member.getAngle(Array.from(member.joints.values()).reduce(function (prev, cur) {
                return cur.pos.y < prev.pos.y ? cur : prev;
            }), { y: 0 }).toFixed(2) + "\xB0"
        ),
        React.createElement(
            "td",
            { key: member.id + "-length" },
            member.getLength().toFixed(2) + " mm"
        ),
        React.createElement(
            "td",
            { key: member.id + "-force" },
            Math.abs(member.force).toFixed(3) + " N"
        ),
        React.createElement(
            "td",
            { key: member.id + "-force-type" },
            member.force < 0 ? "Compression" : "Tension"
        ),
        React.createElement(
            "td",
            { key: member.id + "-member-type" },
            "" + (member.material.count > 1 ? member.material.count + " x " : "") + member.material.type.name
        ),
        React.createElement(
            "td",
            { key: member.id + "-capacity" },
            member.cap(member.bridge.safetyFactor).toFixed(3) + " N"
        ),
        React.createElement(
            "td",
            { key: member.id + "-cost" },
            "$" + member.cost()
        ),
        React.createElement(
            "td",
            { key: member.id + "-safety-factor" },
            "" + (member.safetyFactor() < 10000 ? member.safetyFactor().toFixed(3) : "infinite")
        )
    );
}
function MemberTable(props) {
    return Array.from(props.members.values()).map(function (member) {
        return React.createElement(MemberRow, { member: member });
    });
}

export { MemberTable };