// app.js

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "789878332530",
  appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
  measurementId: "G-XMHHKFJ9QW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db = firebase.firestore();
const auth = firebase.auth();

// Sign in anonymously
auth.signInAnonymously().catch((error) => {
  console.error("Error signing in anonymously: ", error);
});

// React component
class App extends React.Component {
  componentDidMount() {
    auth.onAuthStateChanged((user) => {
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
