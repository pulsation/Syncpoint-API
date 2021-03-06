// This is bound to the handshake database
// we listen for requests for new sessions, and connect them to the correct per-user control channel
// 

var coux = require('coux').coux,
    e = require('errlog').e,
    syncpointHelpers = require('../lib/syncpointHelpers'),
    config;

exports.bind = function(control, conf) {
    config = conf;
    control.safe("console","approved", newPairingUserDoc);
}

function newPairingUserDoc(pairingUserDoc) {
  // todo validate pairingUserDocDoc.app_id
  console.log('newPairingUserDoc', pairingUserDoc._id)
  if (pairingUserDoc.owner_id) {
    // bind to this user
    coux([config.host, config.users_db, pairingUserDoc.owner_id], function(err, userDoc) {
        if (err) {
            console.error("user not found, can't activate session", 
              pairingUserDoc.owner_id, err);
        } else { // make one
          syncpointHelpers.activatePairingUser(pairingUserDoc, userDoc, config);
        }
    });
  } else if (pairingUserDoc.pairing_full_name) {
    // create a user with this full name
    coux([config.host, "_uuids"], function(err, data) {
      var userId = data.uuids[0], 
        userDoc = {
          _id : "org.couchdb.user:"+userId,
          app_id : pairingUserDoc.pairing_app_id,
          name : userId,
          full_name : pairingUserDoc.pairing_full_name,
          type : "user",
          roles : []
        };
      console.log("making user: ", userDoc._id);
      syncpointHelpers.activatePairingUser(pairingUserDoc, userDoc, config);      
    })
  }
}
