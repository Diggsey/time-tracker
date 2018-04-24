import React from 'react';
import _ from 'lodash';
import Tasks from './tasks';

class Range {
    constructor(namedRange, values, appState) {
        this.name = namedRange.name;
        this.range = namedRange.range;
        this.values = values;
        this.appState = appState;
    }
    set(index, rowValues) {
        const row = this.values[index];
        for (var i = 0; i < rowValues.length; ++i)
            if (rowValues[i] != null)
                row[i] = rowValues[i];
        this.appState.forceUpdate();
        return this.appState.setRow(this.range, index, rowValues);
    }
    append(rowValues) {
        this.values.push(rowValues.slice());
        this.appState.forceUpdate();
        return this.appState.appendRow(this.name, rowValues);
    }
    delete_(index) {
        this.values.splice(index, 1);
        this.appState.forceUpdate();
        return this.appState.deleteRow(this.range, index);
    }
    move(fromIndex, toIndex) {
        if (fromIndex == toIndex || fromIndex == toIndex-1)
            return;
        const movedRow = this.values.splice(fromIndex, 1)[0];
        if (fromIndex >= toIndex)
            this.values.splice(toIndex, 0, movedRow);
        else
            this.values.splice(toIndex-1, 0, movedRow);
        this.appState.forceUpdate();
        return this.appState.moveRow(this.range, fromIndex, toIndex);
    }
}

class AppState extends React.Component {
    constructor(props) {
        super(props);
        this.refreshTimeout = null;
        this.inFlightUpdates = 0;
    }
    componentDidMount() {
        this.refresh();
    }
    doUpdate(promise) {
        ++this.inFlightUpdates;
        return promise.then(() => this.refresh()).then(
            (result) => {
                if (--this.inFlightUpdates == 0)
                    this.setState(result)
            },
            (error) => --this.inFlightUpdates
        );
    }
    setRow(range, index, rowValues) {
        return this.doUpdate(gapi.client.sheets.spreadsheets.values.batchUpdateByDataFilter({
            spreadsheetId: this.props.sheet,
            valueInputOption: 'RAW',
            data: [{
                dataFilter: {gridRange: {
                    ...range,
                    startRowIndex: range.startRowIndex + index,
                    endRowIndex: range.startRowIndex + index + 1
                }},
                majorDimension: 'ROWS',
                values: [rowValues]
            }]
        }));
    }
    deleteRow(range, index) {
        return this.doUpdate(gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.props.sheet,
            includeSpreadsheetInResponse: false,
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: range.sheetId,
                        dimension: 'ROWS',
                        startIndex: range.startRowIndex + index,
                        endIndex: range.startRowIndex + index + 1
                    }
                }
            }]
        }));
    }
    moveRow(range, fromIndex, toIndex) {
        return this.doUpdate(gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.props.sheet,
            includeSpreadsheetInResponse: false,
            requests: [{
                moveDimension: {
                    source: {
                        sheetId: range.sheetId,
                        dimension: 'ROWS',
                        startIndex: range.startRowIndex + fromIndex,
                        endIndex: range.startRowIndex + fromIndex + 1
                    },
                    destinationIndex: range.startRowIndex + toIndex
                }
            }]
        }));
    }
    appendRow(rangeName, rowValues) {
        return this.doUpdate(gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: this.props.sheet,
            valueInputOption: 'RAW',
            range: rangeName,
            majorDimension: 'ROWS',
            values: [rowValues]
        }));
    }
    refresh() {
        if (this.refreshTimeout != null) {
            clearTimeout(this.refreshTimeout);
        }
        this.refreshTimeout = setTimeout(() => {
            this.doUpdate(Promise.resolve());
        }, 60000);

        return gapi.client.sheets.spreadsheets.get({
            spreadsheetId: this.props.sheet
        }).then(({result}) => {
            const sheets = _(result.sheets).map('properties').keyBy('sheetId').value();

            const rangeKey = (range) => `${range.sheetId}-${range.startColumnIndex}`;
            const namedRanges = _(result.namedRanges).map((v) => ([
                rangeKey(v.range),
                {
                    name: v.name,
                    range: {
                        ...v.range,
                        endRowIndex: sheets[v.range.sheetId].gridProperties.rowCount
                    }
                }
            ])).fromPairs().value();

            return gapi.client.sheets.spreadsheets.values.batchGetByDataFilter({
                spreadsheetId: this.props.sheet,
                dataFilters: _.map(namedRanges, v => ({gridRange: v.range})),
                majorDimension: 'ROWS',
                valueRenderOption: 'UNFORMATTED_VALUE'
            }).then(({result}) => (
                _(result.valueRanges)
                    .map(({dataFilters, valueRange}) => {
                        const range = dataFilters[0].gridRange;
                        const namedRange = namedRanges[rangeKey(range)];
                        return [namedRange.name, new Range(namedRange, valueRange.values, this)]
                    })
                    .fromPairs()
                    .value()
            ));
        }).then((result) => this.setState(result));
    }
    render() {
        if (this.state) {
            return <div>
                <Tasks {...this.state} />
            </div>;
        } else {
            return <h1>Loading spreadsheet...</h1>;
        }
    }
    componentWillUnmount() {
        clearTimeout(this.refreshTimeout);
    }
}

export default AppState;
