const Koa = require('koa');
const proxy = require('koa-proxy');
const serve = require('koa-static');
const PouchDB = require('pouchdb');
const IO = require('koa-socket');

const app = new Koa();
const io = new IO();
const dbHost = 'http://localhost:5984';
const port = 8080;

io.attach(app);
// Selainsovelluksen jakaminen tuotantoversiossa build-kansiosta.
app.use(serve('build'));
// Pyyntöjen välitys tietokantaan.
app.use(proxy({ host: dbHost }));

app.listen(port);
console.log(`listening on port ${port}`);

app._io.on('connection', function(socket) {
  // Mapiin tallennetaan aloitetut tietokantojen kuuntelut, jotta
  // kuuntelut voidaan lopettaa kun client sulkee yhteyden (sivulta
  // poistutaan tms.).
  const changeListeners = new Map();
  // Aloita muutospyyntöjen kuuntelu. Parametrina tulee antaa
  // tietokannan nimi, jonka muutoksista halutaan tieto.
  socket.on('addListener', function(dbName) {
    if (!changeListeners.has(dbName)) {
      const db = new PouchDB(`${dbHost}${dbName}`);
      changeListeners.set(
        dbName,
        db
          .changes({ live: true, include_docs: true, since: 'now' })
          .on('change', function(change) {
            socket.emit('change', change.doc);
          })
      );
    }
  });
  socket.on('removeListener', function(dbName) {
    if (changeListeners.has(dbName)) {
      changeListeners.get(dbName).cancel();
      changeListeners.delete();
    }
  });
  socket.on('disconnect', function() {
    changeListeners.forEach(function(changes) {
      changes.cancel();
    });
    changeListeners.clear();
  });
});
