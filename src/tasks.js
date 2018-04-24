import React from 'react';
import {
    Table, TableRow, TableBody, TableRowColumn, TableHeader, TableHeaderColumn
} from 'material-ui/Table';
import Checkbox from 'material-ui/Checkbox';
import ActionInactive from 'material-ui/svg-icons/action/schedule';
import ActionActive from 'material-ui/svg-icons/action/watch-later';
import moment from 'moment';
import TimeSince from './time-since';
import 'moment-msdate';
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import FlatButton from 'material-ui/FlatButton';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ActionMoveUp from 'material-ui/svg-icons/navigation/arrow-upward';
import ActionMoveDown from 'material-ui/svg-icons/navigation/arrow-downward';

class TaskName extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            focused: false,
            name: null
        };
    }
    getName() {
        return this.state.focused ? this.state.name : this.props.name;
    }
    nameChanged(name) {
        if (this.state.focused) this.setState({name});
    }
    focusChanged(focused) {
        const name = this.getName();
        if (focused) {
            this.setState({focused, name})
        } else {
            if (name != this.props.name)
                this.props.onNameChange(this.getName());
            this.setState({
                focused,
                name: null
            })
        }
    }
    componentDidMount() {
        if (this.props.autoFocus)
            this.refs.textFieldRef.select();
    }
    render() {
        return <TextField
            ref="textFieldRef"
            className="text-field"
            value={this.getName()}
            name={this.props.taskId.toString()}
            onBlur={() => this.focusChanged(false)}
            onFocus={() => this.focusChanged(true)}
            onChange={(e) => this.nameChanged(e.target.value)}
            onKeyDown={(e) => { if (e.keyCode == 13) e.target.blur(); }}
            onClick={(e) => e.stopPropagation()}
            />;
    }
}

const TaskToggle = (props) => {
    const isSelected = props.startTime != null;
    const timeSince = isSelected ? <TimeSince startTime={props.startTime} /> : null;
    return <Checkbox
        className="switch"
        style={{margin: 8}}
        iconStyle={{width: 48, height: 48}}
        labelStyle={{lineHeight: '48px'}}
        checked={isSelected}
        onCheck={() => props.onSelect(!isSelected)}
        checkedIcon={<ActionActive style={{width: 48, height: 48}} />}
        uncheckedIcon={<ActionInactive style={{width: 48, height: 48}} />}
        label={timeSince}
        onClick={(e) => e.stopPropagation()}
        />;
}

class Tasks extends React.Component {
    constructor(props) {
        super(props);
        this.addedTask = null;
        this.state = {};
    }
    taskIndex(taskId) {
        return _.findIndex(this.props.TasksRange.values, ([taskName, taskId2]) => (
            taskId2 == taskId
        ));
    }
    selectedTaskIndex() {
        return this.taskIndex(this.state.selectedTaskId);
    }
    activateTask(taskId) {
        this.props.DataRange.append([taskId, moment().toOADate()]);
    }
    renameTask(taskId, name) {
        const taskIndex = this.taskIndex(taskId);
        if (taskIndex != -1) {
            this.props.TasksRange.set(taskIndex, [name]);
        }
    }
    addTask() {
        const newTaskId = this.props.ConfigRange.values[0][0];
        this.props.ConfigRange.set(0, [newTaskId + 1]);
        this.addedTask = newTaskId;
        this.props.TasksRange.append(["New Task", newTaskId]);
    }
    taskRow({taskId, taskName, startTime}) {
        return <TableRow
            key={taskId}
            onClick={(e) => false}
            selected={this.state.selectedTaskId == taskId}
            >
            <TableRowColumn>
                <TaskName
                    taskId={taskId}
                    name={taskName}
                    onNameChange={(name) => this.renameTask(taskId, name)}
                    autoFocus={this.addedTask == taskId}
                    />
            </TableRowColumn>
            <TableRowColumn>
                <TaskToggle
                    startTime={startTime}
                    onSelect={(checked) => this.activateTask(checked ? taskId : 1)}
                    />
            </TableRowColumn>
        </TableRow>;
    }
    selectRow(rowIndex) {
        this.setState({
            selectedTaskId: (rowIndex == null ? null : this.props.TasksRange.values[rowIndex+1][1])
        })
    }
    deleteTask() {
        const taskIndex = this.selectedTaskIndex();
        if (taskIndex != -1) {
            this.props.TasksRange.delete_(taskIndex);
            this.setState({selectedTaskId: null})
        }
    }
    moveTaskUp() {
        const taskIndex = this.selectedTaskIndex();
        if (taskIndex != -1 && taskIndex > 1) {
            this.props.TasksRange.move(taskIndex, taskIndex-1);
        }
    }
    moveTaskDown() {
        const taskIndex = this.selectedTaskIndex();
        const taskCount = this.props.TasksRange.values.length;
        if (taskIndex != -1 && taskIndex < taskCount-1) {
            this.props.TasksRange.move(taskIndex, taskIndex+2);
        }
    }
    render() {
        const [selectedId, startTime] = _.last(this.props.DataRange.values);
        const startMoment = moment.fromOADate(startTime);
        const tasks = _(this.props.TasksRange.values).
            tail()
            .map(([taskName, taskId]) => this.taskRow({
                taskId,
                taskName,
                startTime: (taskId == selectedId ? startMoment : null)
            }))
            .value();
        this.addedTask = null;
        const selectedTaskIndex = this.selectedTaskIndex();
        const taskCount = this.props.TasksRange.values.length;
        return <div>
            <FlatButton
                label="Delete"
                icon={<ActionDelete />}
                style={{margin: 16}}
                disabled={selectedTaskIndex == -1}
                onClick={(e) => this.deleteTask()}
                secondary
                />
            <FlatButton
                label="Move Up"
                icon={<ActionMoveUp />}
                style={{margin: 16}}
                disabled={selectedTaskIndex == -1 || selectedTaskIndex <= 1}
                onClick={(e) => this.moveTaskUp()}
                />
            <FlatButton
                label="Move Down"
                icon={<ActionMoveDown />}
                style={{margin: 16}}
                disabled={selectedTaskIndex == -1 || selectedTaskIndex >= taskCount-1}
                onClick={(e) => this.moveTaskDown()}
                />
            <Table
                onRowSelection={([rowIndex]) => this.selectRow(rowIndex)}
                >
                <TableBody deselectOnClickaway={false}>
                    {tasks}
                </TableBody>
            </Table>
            <FloatingActionButton style={{margin:10}} onClick={() => this.addTask()}>
                <ContentAdd />
            </FloatingActionButton>
        </div>;
    }
}

export default Tasks;
