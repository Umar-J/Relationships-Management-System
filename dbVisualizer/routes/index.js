const url = require('url')
const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
const db = new sqlite3.Database('data/db_1200iRealSongs')

db.serialize(function() {
  //make sure a couple of users exist in the database.
  //user: ldnel password: secret
  //user: frank password: secret2
  let sqlString = "CREATE TABLE IF NOT EXISTS users (userid TEXT PRIMARY KEY, password TEXT)"
  db.run(sqlString)
  sqlString = "INSERT OR REPLACE INTO users VALUES ('ldnel', 'secret')"
  db.run(sqlString)
  sqlString = "INSERT OR REPLACE INTO users VALUES ('admin', 'admin')"
  db.run(sqlString)
})

exports.authenticate = function(request, response, next) {
  /*
	Middleware to do BASIC http 401 authentication
	*/
  var auth = request.headers.authorization
  // auth is a base64 representation of (username:password)
  //so we will need to decode the base64
  if (!auth) {
    //note here the setHeader must be before the writeHead
    response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
    response.writeHead(401, {
      'Content-Type': 'text/html'
    })
    console.log('No authorization found, send 401.')
    response.end()
  } else {
    console.log("Authorization Header: " + auth)
    //decode authorization header
    // Split on a space, the original auth
    //looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
    var tmp = auth.split(' ')

    // create a buffer and tell it the data coming in is base64
    var buf = Buffer.from(tmp[1], 'base64');

    // read it back out as a string
    //should look like 'ldnel:secret'
    var plain_auth = buf.toString()
    console.log("Decoded Authorization ", plain_auth)

    //extract the userid and password as separate strings
    var credentials = plain_auth.split(':') // split on a ':'
    var username = credentials[0]
    var password = credentials[1]
    console.log("User: ", username)
    console.log("Password: ", password)

    var authorized = false;
    //check database users table for user
    db.all("SELECT userid, password FROM users", function(err, rows) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].userid == username & rows[i].password == password) authorized = true
      }
      if (authorized == false) {
        //we had an authorization header by the user:password is not valid
        response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
        response.writeHead(401, {
          'Content-Type': 'text/html'
        })
        console.log('No authorization found, send 401.')
        response.end()
      } else
        next()
    })
  }

  //notice no call to next()

}

exports.index = function(request, response) {
  // index.html
  response.render('index', {
    title: 'Community Database',
    //body: 'rendered with handlebars'
  })
}

function parseURL(request, response) {
  const PARSE_QUERY = true //parseQueryStringIfTrue
  const SLASH_HOST = true //slashDenoteHostIfTrue
  let urlObj = url.parse(request.url, PARSE_QUERY, SLASH_HOST)
  console.log('path:')
  console.log(urlObj.path)
  console.log('query:')
  console.log(urlObj.query)
  //for(x in urlObj.query) console.log(x + ': ' + urlObj.query[x])
  return urlObj

}

exports.users = function(request, response) {
  // /users
  db.all("SELECT userid, password FROM users", function(err, rows) {
    response.render('users', {
      title: 'Users:',
      userEntries: rows
    })
  })
}

exports.find = function(request, response) {
  // /songs?title=Girl
  console.log("RUNNING FIND SONGS");

  let urlObj = parseURL(request, response)
  let sql = "SELECT id, title FROM songs"
  //let sql = "Select RelationshipID, RelationshipName from relationships"

  if (urlObj.query['title']) {
    console.log("finding title: " + urlObj.query['title'])
    sql = "SELECT id, title FROM songs WHERE title LIKE '%" + urlObj.query['title'] + "%'"
    //sql = "Select RelationshipID, RelationshipName from relationships WHERE RelationshipName LIKE '%" + urlObj.query['title'] + "%'"
  }

  db.all(sql, function(err, rows) {
    response.render('songs', {
      title: 'Organizations matching search: '+ urlObj.query['title'],
      entries: rows
    })
  })
}
exports.find2 = function(request, response) {
  // /songs?title=Girl
  console.log("RUNNING FIND 2");

  let urlObj = parseURL(request, response)
  //let sql = "SELECT id, title FROM songs"
  let sql = "Select RelationshipID, RelationshipName from relationships"

  if (urlObj.query['title']) {
    console.log("finding title: " + urlObj.query['title'])
    //sql = "SELECT id, title FROM songs WHERE title LIKE '%" + urlObj.query['title'] + "%'"
    sql = "Select RelationshipID, RelationshipName from relationships WHERE RelationshipName LIKE '%" + urlObj.query['title'] + "%'"
  }

  db.all(sql, function(err, rows) {
    response.render('relationships', {
      title: 'Organizations 22 matching search: '+ urlObj.query['title'],
      entries: rows
    })
  })
}
exports.songDetails = function(request, response) {

  let urlObj = parseURL(request, response)
  let songID = urlObj.path //expected form: /song/235
  songID = songID.substring(songID.lastIndexOf("/") + 1, songID.length)

  let sql = "SELECT id, title, composer, key, bars FROM songs WHERE id=" + songID
  console.log("GET SONG DETAILS: " + songID)

  db.all(sql, function(err, rows) {
    console.log('Song Data')
    console.log(rows)
    response.render('songDetails', {
      title: 'Songs Details:',
      songEntries: rows
    })
  })

}
exports.orgDetails = function(request, response) {

  let urlObj = parseURL(request, response)
  let orgID = urlObj.path //expected form: /song/235
  orgID = orgID.substring(orgID.lastIndexOf("/") + 1, orgID.length)

  let sql = "SELECT * FROM relationships WHERE RelationshipID=" + orgID
  console.log("GET RELATIONSHIP DETAILS: " + orgID)

  db.all(sql, function(err, rows) {
    console.log('Relationship Data')
    console.log(rows)
    response.render('relationshipDetails', {
      title: 'Relationship Details:',
      entries: rows
    })
  })

}