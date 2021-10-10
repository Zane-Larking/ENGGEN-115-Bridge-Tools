
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function MemberRow(member) {
    console.log(member);
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

// console.log(bridge);
function MemberTableFactory(members) {
    var MemberTable = function (_React$Component) {
        _inherits(MemberTable, _React$Component);

        function MemberTable(props) {
            _classCallCheck(this, MemberTable);

            var _this = _possibleConstructorReturn(this, (MemberTable.__proto__ || Object.getPrototypeOf(MemberTable)).call(this, props));

            _this.state = { liked: false };
            return _this;
        }

        _createClass(MemberTable, [{
            key: "render",
            value: function render() {
                var rows = [];
                console.log(members);
                members.forEach(function (member) {
                    console.log(member);
                    rows.push(MemberRow(member));
                });

                return rows;
            }
        }]);

        return MemberTable;
    }(React.Component);

    return MemberTable;
}

// console.log(MemberTableFactory);
export { MemberTableFactory };