import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, onValue } from "firebase/database";
export default class Firebase {
  constructor() {
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyAXBDZ7oprpy-U1ARStWUFg20DkjVKcBbc",
      authDomain: "projetexample.firebaseapp.com",
      databaseURL: "https://projetexample.firebaseio.com",
      projectId: "projetexample",
      storageBucket: "projetexample.appspot.com",
      messagingSenderId: "623421962452",
      appId: "1:623421962452:web:a1f376413adf0f1a33a341",
    };
    const app = initializeApp(firebaseConfig);

    const auth = getAuth();
    // onAuthStateChanged(auth, (user) => {
    //   if (user) {
    //     this.uid = user.uid;
    //     console.log("UID", this.uid);
    //   }
    // });
    signInAnonymously(auth)
      .then(() => {
        console.log("signed in");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
    this.DATABASE = getDatabase();
  }

  addEventListener(_path, _callback) {
    const path = ref(this.DATABASE, _path);
    let resume = false;
    console.log("firebase listener added");
    onValue(path, (snapshot) => {
      if (resume) {
        const data = snapshot.val();
        _callback(data);
      } else {
        resume = true;
      }
    });
  }

  send(_path, _val) {
    const path = ref(this.DATABASE, _path);
    set(path, _val);
  }
}
