import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';

const GoogleAuth = new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            'clientId': '286984093971-16of5d26s1i7lta72980nlp7qfsc95cs.apps.googleusercontent.com',
            'scope': 'profile email https://www.googleapis.com/auth/spreadsheets',
            'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
        }).then(() => {
            resolve(gapi.auth2.getAuthInstance())
        }, reject);
    });
});

const States = Object.freeze({
    INIT: 'INIT',
    AUTH: 'AUTH',
    ERROR: 'ERROR',
    DONE: 'DONE'
});

class GoogleLogin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {state: States.INIT};
        GoogleAuth.then((auth) => {
            this.auth = auth;
            this.auth.isSignedIn.listen(() => this.updateSigninStatus());
            this.updateSigninStatus();
        }, (error) => {
            console.error(error);
            this.setState({state: States.ERROR});
        });
    }
    updateSigninStatus() {
        const loggedIn = this.auth.isSignedIn.get();

        if (loggedIn) {
            this.setState({state: States.DONE});
        } else {
            this.setState({state: States.AUTH});
        }
    }
    render() {
        switch (this.state.state) {
            case States.INIT:
                return <h1>Loading...</h1>;
            case States.AUTH:
                return <RaisedButton onClick={() => this.auth.signIn()}>Authorize</RaisedButton>
            case States.ERROR:
                return <h1>Error while authorizing.</h1>
            case States.DONE:
                return <div>{this.props.children}</div>
        }
    }
}

export default GoogleLogin;
