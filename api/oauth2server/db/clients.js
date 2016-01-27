/*
  TODO: replace these clientSecrets by running 'node genClientSecret.js' saving the new ones in here.
 */

var clients = [
    { id: '1', name: 'openmoney-api', clientId: 'openmoney-api', clientSecret: 'c2NyeXB0ABEAAAAIAAAAASapw+KLNNbOqlT38YrCsxFhZGu6NWTSTBRh6uN6aWpj5Dt/jpxk7+s5mDNYYCYLOBSQghEAvEWBaNomX0HrbZPA15KDySPou0y3muScFMds', redirectURI: 'https://cloud.openmoney.cc/V2/oauth/callback' },
    { id: '2', name: 'giftcard-api', clientId: 'giftcard-api', clientSecret: 'c2NyeXB0ABEAAAAIAAAAAan1FhwRUnw6X4iCGzy2SR4AO1omZg419PNR9RlnKlPkmvTPNgtfsV508I2JX67EdVIkEC/dVOw++hI/Xa6t9oslWeoS9RBowpuTCq72ULs/', redirectURI: 'https://deefactorial.proudleo.com/V2/oauth/callback' }
];


exports.find = function(id, done) {
  for (var i = 0, len = clients.length; i < len; i++) {
    var client = clients[i];
    if (client.id === id) {
      return done(null, client);
    }
  }
  return done(null, null);
};

exports.findByClientId = function(clientId, done) {
  for (var i = 0, len = clients.length; i < len; i++) {
    var client = clients[i];
    if (client.clientId === clientId) {
      return done(null, client);
    }
  }
  return done(null, null);
};
