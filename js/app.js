import React from 'https://unpkg.com/react@17/umd/react.production.min.js';
import ReactDOM from 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js';
import { db, auth, onAuthStateChanged, serverTimestamp } from './firebase-setup.js';

class App extends React.Component {
  componentDidMount() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user = user;
      } else {
        console.error("User is not authenticated");
      }
    });
  }

  handleClick = () => {
    if (this.user) {
      db.collection("clicks").add({
        timestamp: serverTimestamp(),
        userId: this.user.uid
      })
      .then(() => {
        console.log("Document successfully written!");
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
    }
  };

  render() {
    return (
      <div className="flex justify-center">
        <button onClick={this.handleClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Click Me
        </button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));