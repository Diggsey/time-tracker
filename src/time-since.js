import React from 'react';
import moment from 'moment';

const activeComponents = [];

function updateComponents() {
    const currentTime = moment();
    for (var i = 0; i < activeComponents.length; ++i) {
        activeComponents[i].setState({currentTime});
    }
}

setInterval(updateComponents, 1000);

const formatUnit = (value, name) => ((value == 1) ? `1 ${name}` : `${value} ${name}s`);

function formatDuration(duration) {
    const seconds = duration.seconds();
    const minutes = duration.minutes();
    const hours = duration.hours();
    const days = duration.days();
    const months = duration.months();
    const years = duration.years();
    var result = formatUnit(seconds, "second");
    if (minutes) result = `${formatUnit(minutes, "minute")}, ${result}`;
    if (hours) result = `${formatUnit(hours, "hour")}, ${result}`;
    if (days) result = `${formatUnit(days, "day")}, ${result}`;
    if (months) result = `${formatUnit(months, "month")}, ${result}`;
    if (years) result = `${formatUnit(years, "year")}, ${result}`;
    return result;
}

export default class TimeSince extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTime: moment()
        }
    }
    componentDidMount() {
        activeComponents.push(this);
    }
    componentWillUnmount() {
        activeComponents.splice(activeComponents.indexOf(this), 1);
    }
    render() {
        return formatDuration(moment.duration(this.state.currentTime.diff(this.props.startTime)));
    }
}
