const {db, admin} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');
const {validateSignupData, validateLoginData, reduceUserDetails} = require('../util/validators');
firebase.initializeApp(config)

exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);

    const noImg = 'no-img.png';

    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
    .then( (doc) => {
        if (doc.exists){
            return res.status(400).json({ handle: 'handle already exists'});
        } else {
           return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password); 
        }
    })
    .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idToken) => {
        token = idToken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            userId
        };
        //return db.collection(`/users/`).add(userCredentials);
        return db.doc(`/users/${newUser.handle}`).set(userCredentials); 
    })
    .then(() => {
       return res.status(201).json({ token });
    })
    .catch( (err) => {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
            res.status(400).json({ email: 'email already in use'});
        }
        return res.status(500).json({ general: 'Something went wrong, try again'});
    })
}

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
    };

    const { valid, errors } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);
    
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
        return data.user.getIdToken();
    })
    .then(token => {
        return res.json({token});
    })
    .catch(err => {
        console.error(err);
        return res.status(403).json({general: 'Wrong credentials, please try again'});
    })

}

exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
        return res.json({message: 'Details updated successfully'})
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}

//Get any user details
exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`).get()
    .then(doc => {
        if(doc.exists){
            userData.user = doc.data();
            return db.collection('screams').where('userHandle', '==', req.params.handle).orderBy('date', 'desc').get();
        } else {
            return res.status(404).json({error: 'user not found'});
        }
    })
    .then(data => {
        userData.screams = [];
        data.forEach(doc => {
            userData.screams.push({
                body: doc.data().body,
                date: doc.data().date,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                screamId: doc.id
            })
        })
        return res.json(userData);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}

exports.getAuthenticatedUser = (req, res) => {
    let resData = {};
    db.doc(`/users/${req.user.handle}`).get()
    .then(doc => {
        if(doc.exists) {
            resData.credentials = doc.data();
            return db.collection('likes').where('userHandle', '==', req.user.handle).get()
        }
    })
    .then(data => {
        resData.likes = [];
        data.forEach(dc => {
            resData.likes.push(dc.data());

        })
        return db.collection('notifications').where('recipient', '==', req.user.handle).orderBy('createdAt', 'desc').limit(10).get();
    })
    .then(data=> {
        resData.notifications = [];
        data.forEach(doc => {
            resData.notifications.push({
                recipient: doc.data().recipient,
                sender: doc.data().sender,
                screamId: doc.data().screamId,
                type: doc.data().type,
                read: doc.data().read,
                crearedAt: doc.data().createdAt,
                notificationId: doc.id
            })
        })
        return res.json(resData);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
    
}

exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy =  new BusBoy({headers: req.headers});

    let imageFilename;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: 'Wrong file type submitted'});
        }
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        console.log("ERR   " + mimetype);
        imageFilename = `${Math.round(Math.random()*100000000).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFilename);
        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath))

    });

    busboy.on('finish', () => {
         admin.storage().bucket().upload(imageToBeUploaded.filepath, {
             resumable: false,
             metadata: {
                 metadata: {
                    contentType: imageToBeUploaded.mimetype
                 }
             }
         })
         .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFilename}?alt=media`
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl })
        })
        .then(() => {
            return res.json({ message: 'Image uploaded successfully'});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code})
        })
    });
 busboy.end(req.rawBody)
};

// Mark notifications as read
exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`)
        batch.update(notification, {read: true});
    });
    batch.commit()
    .then(() => {
        res.json({message: 'notifications marked as read'});
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code})
    })
}