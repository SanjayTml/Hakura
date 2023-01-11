# Hakura - Random chatroom

Hakura is a random chatroom where anyone can sign in using google account and chat to strangers.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Use node to build and run the project.

## Firebase 

For the backend, Google's [Firebase](https://firebase.google.com/) service is used. 

> Firestore database is used to store the messages.

The following rules are implemented to restrict reading access to chat rooms to only signed in users. Permission to send message is retricted to signed in users using only their user id and when they are not in the banned list.

```
match /{document=**} {
        allow read, write: if false;
    }
    
    match /messages/{docId} {
    	allow read: if request.auth.uid != null;
        allow create: if canCreateMessage();
    }
    
    function canCreateMessage() {
        let isSignedIn = request.auth.uid != null;
        let isOwner = request.auth.uid == request.resource.data.uid;
      
        let isNotBanned = exists(
      	    /databases/$(database)/documents/banned/$(request.auth.uid)
        ) == false;
      
        return isSignedIn && isOwner && isNotBanned;
    }
```

