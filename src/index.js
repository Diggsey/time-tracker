import React from 'react';
import ReactDOM from 'react-dom';
import QueryString from 'query-string';
import GoogleLogin from './google-login';
import AppState from './app-state';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import FlatButton from 'material-ui/FlatButton';
import Card from 'material-ui/Card';

class App  extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lightTheme: true
        };
    }
    render() {
        const theme = this.state.lightTheme ? lightBaseTheme : darkBaseTheme;
        document.documentElement.style.backgroundColor = theme.palette.canvasColor;
        return <MuiThemeProvider
            muiTheme={getMuiTheme(theme)}
            >
            <AppBar
                title="Time Tracker"
                iconElementRight={
                    <FlatButton
                        label={this.state.lightTheme ? "Dark Theme" : "Light Theme"}
                        onClick={() => this.setState({lightTheme: !this.state.lightTheme})}
                        />
                }
                />
            <GoogleLogin>
                <AppState sheet={this.props.sheet} />
            </GoogleLogin>
        </MuiThemeProvider>;
    }
}

const parsed = QueryString.parse(window.location.search);

ReactDOM.render(
    <App sheet={parsed.sheet} />,
    document.getElementById('app'),
);

if (module.hot) {
    module.hot.accept();
}
