// app.js

// Import Firebase services
import { db, auth, onAuthStateChanged } from './index.html';

// React component
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
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
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

// Render the React component
ReactDOM.render(<App />, document.getElementById('root'));
