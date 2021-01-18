const functions = require('firebase-functions');
const cors = require('cors');

const app = require('express')();
app.use(cors({origin: true}));

const { getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream} = require('./handlers/screams');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead} = require('./handlers/users');
const FBAuth = require('./util/FBAuth');
const {db} = require('./util/admin');


// Get all screams
app.get('/screams', getAllScreams);

// Post scream Route
app.post('/scream', FBAuth, postOneScream);

// Get scream route
app.get('/scream/:screamId', getScream);

// Comment on scream
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);

//Like and unlike scream
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);

//Delete scream
app.delete('/scream/:screamId', FBAuth, deleteScream);

// Signup route
app.post('/signup', signup)

//Login Route
app.post('/login', login);

// User Routes
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)
app.get('/user/:handle', getUserDetails)
app.post('/notifications', FBAuth, markNotificationsRead)

// Exports all routes
exports.api = functions.region('europe-west1').https.onRequest(app);

//Notifications

exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}')
.onCreate((snapshot) => {
    return db.doc('/screams/' + snapshot.data().screamId).get()
    .then(doc=> {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                screamId: doc.id

            });
        }
    })
    .catch(err => {
        console.error(err);
    })
});

exports.deleteNotificationOnUnlike = functions.region('europe-west1').firestore.document('likes/{id}')
.onDelete(snapshot => {
    return db.doc(`/notifications/${snapshot.id}`).delete()
    .catch(err => {
        console.error(err);
    })
})

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
.onCreate(snapshot => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc=> {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read: false,
                screamId: doc.id

            })
        }
    })
    .catch(err => {
        console.error(err);
    })
})
exports.userImageChange = functions.region('europe-west1').firestore.document('/users/{userId}').onUpdate(change => {
    if(change.before.data().imageUrl !== change.after.data().imageUrl) {
        const batch = db.batch();
        return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
            .then(data => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`)
                batch.update(scream, {userImage: change.after.data().imageUrl});
                })
                 return batch.commit();
             })
    }
})

exports.onScreamDeleted = functions.region('europe-west1').firestore.document('/screams/{screamId}').onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db.collection('comments').where('screamId', '==', screamId).get()
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/comments/${doc.id}`));
        })
        return db.collection('likes').where('screamId', '==', screamId).get();
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/likes/${doc.id}`));
        })
        return db.collection('notifications').where('screamId', '==', screamId).get();
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/notifications/${doc.id}`));
        })
        return batch.commit();
    })
    .catch(err => {
        console.error(err);
    })
})
