export const ICE = 'ice';
export const OFFER = 'offer';
export const ONLINE = 'online';
export const ANSWER = 'answer';
console.log('constants.js | stun',process.env.REACT_APP_STUN_SERVERS, 'other', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN )
export const SERVERS = JSON.parse(process.env.REACT_APP_STUN_SERVERS)
