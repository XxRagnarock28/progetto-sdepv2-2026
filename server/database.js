//Questo file serve per creare ed aprire la connessione tra il server Node.js e il database MySQL

const mysql = require('mysql2');               //Importazione del modulo mysql2, sarebbe quello che permette a Node.js di comunicare con MySQL. Permette anche a Node.js di fare query al database MySQL

const connection = mysql.createConnection({            //Serve per dire a Node a quale database collegarsi, queste varie informazioni vengono salvate all'interno della variabile connection 
    host: 'localhost',                                 //Il database è situato sul computer locale
    user: 'root',                                      //Utente MySQL utilizzato 
    password: '',                                      //La password, in questo caso nel mio ambiente è vuota
    database: 'prenotazione_sale'                      //Nome del database 
});

                                                       //Connection è l'oggetto che rappresenta la connessione tra il server Node.js e il database MySQL e che utilizzo successivamente per eseguire le query.
connection.connect((err) => {                         //Prova effettivamente ad aprire la connessione
    if (err) {
        console.error('Errore di connessione al database:', err);
        return;
    }

    console.log('Connessione al database riuscita!');
});

module.exports = connection;              //Questa riga serve per rendere disponibile la variabile connection anche agli altri file 