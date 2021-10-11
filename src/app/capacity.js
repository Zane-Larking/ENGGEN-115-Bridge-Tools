'use strict';

function Capacity(props) {
    return React.createElement(
        'div',
        null,
        React.createElement(
            'h2',
            null,
            'Overall Maximum Capacity: ',
            props.cap.toFixed(2)
        ),
        React.createElement(
            'p',
            null,
            props.brokenMember,
            ' breaks under ',
            props.forceType,
            ' at ',
            props.force.toFixed(2)
        )
    );
}

export { Capacity };