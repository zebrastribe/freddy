import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "789878332530",
  appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
  measurementId: "G-XMHHKFJ9QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

async function testEmulator() {
  console.log("🧪 Testing emulator connection...");
  
  try {
    // Try to write a simple test document
    await setDoc(doc(db, "test", "test-doc"), {
      message: "Hello from emulator test",
      timestamp: new Date()
    });
    
    console.log("✅ Successfully wrote to emulator!");
    
    // Try to read it back
    const testDoc = await getDoc(doc(db, "test", "test-doc"));
    if (testDoc.exists()) {
      console.log("✅ Successfully read from emulator!");
      console.log("📄 Document data:", testDoc.data());
    }
    
  } catch (error) {
    console.error("❌ Error testing emulator:", error);
  }
}

testEmulator(); 