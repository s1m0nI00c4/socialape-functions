// Helper functions

const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
     if(email.match(emailRegEx)) 
        return true
     else 
        return false;
}

const hasProperLength = (string, min, max) => {
    if (string.length < min || string.length > max)
        return false;
    else
        return true;
}

exports.validateSignupData = newUser => {
    let errors = {};

    //Validate email
    if(isEmpty(newUser.email)) {
        errors.email = 'Email cannot be empty';
    } else if(!isEmail(newUser.email)) {
        errors.email = 'Email is not valid';
    }
    if(!hasProperLength(newUser.email, 6, 255))
        errors.email = 'Email must be at least 6 and at most 255 characters long';

    //Validate password
    if(isEmpty(newUser.password))
        errors.password = 'Password cannot be empty';
    if(newUser.password !== newUser.confirmPassword)
        errors.confirmPassword = 'Password and confirm password must match';
    if(!hasProperLength(newUser.password, 6, 255))
        errors.password = 'Password must be at least 6 and at most 255 characters long';
    
    //Validate handle
    if(isEmpty(newUser.handle))
        errors.handle = 'Handle cannot be empty';
    if(!hasProperLength(newUser.handle, 6, 255))
        errors.handle = 'Handle must be at least 6 and at most 255 characters long';

    //Check for errors

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = user => {
    
    let errors = {};

    //Validate email
    if(isEmpty(user.email)) {
        errors.email = 'Email cannot be empty';
    } else if(!isEmail(user.email)) {
        errors.email = 'Email is not valid';
    }

    //Validate password
    if(isEmpty(user.password))
        errors.password = 'Password cannot be empty';
    
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.reduceUserDetails = data => {
    let userDetails = {};

    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.website.trim())) {
        if(data.website.trim().substring(0,4) !== 'http') {
            userDetails.website = 'http://' + data.website.trim();
        } else {
            userDetails.website = data.website;
        }
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;

}