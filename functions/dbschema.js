const { user } = require("firebase-functions/lib/providers/auth")

let db = {
    screams: [
        {
            userHandle: 'user',
            body: 'some scream',
            date: '2011-10-05T14:48:00.000Z',
            likeCount: 5,
            commentCount: 2

        }],
    comments: [
        {
            userHandle: 'user',
            screamId: 'ghgyioiojkgyrt',
            body: 'nice one!',
            createdAt: '2011-10-05T14:48:00.000Z'
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'john',
            read: 'true',
            screamId: 'fghftfgvju87767ghg',
            type: 'like|comment',
            createdAt: '2011-10-05T14:48:00.000Z'
        }
    ],
    users: [
        {
            userId: 'tfjygjgt88676huu',
            email: 'user@email.com',
            handle: 'user',
            date: '2011-10-05T14:48:00.000Z',
            imageURL: 'https://www.google.com/image.png',
            bio: 'Smt',
            website: 'https://www.google.com',
            location: 'London, UK'
        }
    ]
}

const userDetails = {
    // Redux Data
    credentials: {
        userId: 'tfjygjgt88676huu',
        email: 'user@email.com',
        handle: 'user',
        date: '2011-10-05T14:48:00.000Z',
        imageURL: 'https://www.google.com/image.png',
        bio: 'Smt',
        website: 'https://www.google.com',
        location: 'London, UK'
    },
    likes: [
        {
            userHandle: 'user',
            screamId: 'hgfuygjyvftt5'
        },
        {
            userHandle: 'user',
            screamId: 'jkgjhbjjy77777vgg'
        }

    ]
}