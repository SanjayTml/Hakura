import { useState, useRef } from 'react'
import './App.css';

// Importing functions from the packages 
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, query, getDocs, collection, where, addDoc, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signOut, fetchSignInMethodsForEmail } from "firebase/auth";

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import firebaseConfig from './.env'

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestoreDB = getFirestore(app);
const analytics = getAnalytics(app);

const auth = getAuth(app);

function App() {
  const [user, loading, error] = useAuthState(auth);
  console.log("USER:",user)
  return (
    <div className="App">
      <header>
        <h2>#Hakura</h2>
        <GoogleSignOut />
      </header>
      <section>
        {user ? <ChatRoom/> : <GoogleSignIn/>}
      </section>
    </div>
  );
}

function GoogleSignIn() {

  const provider = new GoogleAuthProvider();
  const signInWithGoogle = async () => {
    try {
      const res = await signInWithRedirect(auth, provider);
      const user = res.user;
      const q = query(collection(firestoreDB, "users"), where("uid", "==", user.uid));
      const docs = await getDocs(q);
      if (docs.docs.length === 0) {
        await addDoc(collection(firestoreDB, "users"), {
          uid: user.uid,
          name: user.displayName,
          authProvider: "google",
          email: user.email,
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign In With Google</button>
      <label>Do not violate good user rules!</label>
    </>
  )

}

function ChatRoom() {
  const messagesRef = collection(firestoreDB, "messages");
  const q = query(messagesRef, orderBy('createdAt'), limit(25));
  const [messages] = useCollectionData(q, {idField: 'id'});

  const dummy = useRef();

  const [formValue, setFormValue] = useState('');

  const sendMessage = async(e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;
    
    await addDoc(collection(firestoreDB, "messages"), {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL
    })

    setFormValue('');

    dummy.current.scrollIntoView({
      behaviour: "smooth"
    });
  }

  return (
    <>
    <main>
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      <div ref={dummy}></div>
    </main>

    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Write your message"/>
      <button type="submit">Send</button>
    </form>
    </>
  )
}

function ChatMessage(props) {
  const {text, uid, photoURL} = props.message
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'} />
      <p>{text}</p>
    </div>
  )
}

function GoogleSignOut() {
  return(
    <button className="sign-out" onClick={() => signOut(auth)}>Sign Out</button>
    )
}

export default App;
