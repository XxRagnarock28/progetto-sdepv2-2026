const express = require ('express');                 //Importo il modulo express tramite la funzione require, lo salvo all'interno di una costante così posso utilizzarlo per creare e gestire il server
const database = require ('./database');           //Importo il file database dalla cartella corrente, lo utilizzo per eseguire le query al database MySql
const bcrypt = require ('bcrypt');                //Serve per andare a fare l'hash delle password prima di andare a salvarle nel database, quindi alla fine nella fase di login si vanno a confrontare gli hash 
const session = require ('express-session');    //Lo importo per gestire la sessione utente, così il server si ricorda quando un determinato utente ha fatto l'accesso 

const app = express();                       //Variabile di appoggio messa per comodità, serve lavorare nel server 
app.use(express.static('client'));        //Gli vado a dire che quando il browser chiede un file deve andare a cercarlo dentro la cartella client. Static va messo perché sono file che il server non deve elaborare prima di inviarli 
app.use(express.json());                 //Serve per permettere al server di leggere le richieste che gli invia il browser, visto che le manda in formato JSON 

app.use(session({    
    secret: 'chiave-segreta-progetto',   //Chiave utilizzata per proteggere i dati della sessione
    resave: false,                       //Non salvo nuovamente la sessione se non è stata modificata 
    saveUninitialized: false
}));
                                                //Middleware: Funzione che si mette in mezzo tra la richiesta del client e la risposta del server 
function controllaAdmin(req, res, next) {       //Serve per verificare che chi cerca di utilizzare determinate API sia effettivamente utenticato e un admin 
                                        // req = request, res = response, next dice "il controllo è andato bene, puoi procedere con la prossima funzione"
    if (!req.session.utenteId) {         //Controlla se è loggato 

        return res.status(401).json({                 //Codice http 401 Unauthorized
            messaggio: 'Devi effettuare il login.'
        });
    }

    if (req.session.ruolo !== 'admin') {            //Controlla se è admin

        return res.status(403).json({          //Codice http 403 Forbidden
            messaggio:
                'Non hai i permessi per accedere a questa funzione.'
        });
    }

    next();
}

app.post('/api/registrazione', async (req, res) => {      //Quando viene effettuata la registrazione recuperiamo i dati inviati dal client tramite destructuring 

    const { nome, cognome, email, password } = req.body;

    try {

        const passwordHash = await bcrypt.hash(password, 10);     //Il 10 indica il costo utilizzato da bcrypt per generare l'hash

        const query = `
            INSERT INTO utenti (nome, cognome, email, password)
            VALUES (?, ?, ?, ?)                                     
        `;

        database.query(
            query,
            [nome, cognome, email, passwordHash],
            (err, risultato) => {

                if (err) {

                    console.error(err);

                    if (err.code === 'ER_DUP_ENTRY') {                       //Controlla se l'email è gia presente nel database, di conseguenza se l'utente è registrato 
                        return res.status(400).json({
                            messaggio: "Questa email è già registrata."
                        });
                    }

                    return res.status(500).json({
                        messaggio: "Errore durante la registrazione."
                    });
                }

                res.json({
                    messaggio: "Registrazione completata!"
                });
            }
        );

    } catch (errore) {

        console.error(errore);

        res.status(500).json({
            messaggio: "Errore durante la registrazione."
        });
    }
});

app.post('/api/login', (req, res) => {                   //Funzione che serve a gestire il login 

    const { email, password } = req.body;

    const query = `
        SELECT * FROM utenti
        WHERE email = ?
    `;

    database.query(
        query,
        [email],
        async (err, risultati) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    messaggio: "Errore del server."
                });
            }

            if (risultati.length === 0) {

                return res.status(401).json({
                    messaggio: "Email o password non corrette."
                });
            }

            const utente = risultati[0];

            const passwordCorretta =
                await bcrypt.compare(password, utente.password);            //Confronta se la password inserita corrisponde all'hash salvato 

            if (!passwordCorretta) {

                return res.status(401).json({
                    messaggio: "Email o password non corrette."
                });
            }
            req.session.utenteId = utente.id;                   //Questa riga e quella dopo serve per creare la sessione utente 
            req.session.ruolo = utente.ruolo;                   //Salva il ruolo nella sessione nel momento in cui viene fatto il login 

            res.json({
                messaggio: "Login effettuato con successo!",
                ruolo: utente.ruolo
           });
        }
    );
});

app.post('/api/logout', (req, res) => {               //Funzione per gestire il logout dell'utente

    req.session.destroy((err) => {                //Se viene fatto logout il server distrugge la sessione 

        if (err) {

            return res.status(500).json({
                messaggio: "Errore durante il logout."
            });
        }

        res.json({
            messaggio: "Logout effettuato."
        });
    });
});

app.get('/api/utente', (req, res) => {

    if (!req.session.utenteId) {

        return res.status(401).json({
            autenticato: false
        });
    }

    const query = `
        SELECT id, nome, cognome, email
        FROM utenti
        WHERE id = ?
    `;

    database.query(
        query,
        [req.session.utenteId],
        (err, risultati) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    messaggio: "Errore del server."
                });
            }

            if (risultati.length === 0) {

                return res.status(401).json({
                    autenticato: false
                });
            }

            res.json({
                autenticato: true,
                utente: risultati[0]
            });
        }
    );
});

app.get('/api/sale', (req, res) => {                    //Quando serve l'elenco delle sale vengono recuperate dal database 

    const query = `
        SELECT *
        FROM sale
    `;

    database.query(query, (err, risultati) => {     //Node.js parla direttamente con il database

        if (err) {

            console.error(err);

            return res.status(500).json({
                messaggio: "Errore nel recupero delle sale."
            });
        }

        res.json(risultati);
    });
});

app.post('/api/prenotazioni', (req, res) => {           //"Il controllo viene fatto lato server per evitare che l'utente possa aggirarlo modificando semplicemente il codice JavaScript della pagina."
                                                    //Questa funzionr viene richiamata nel momento in cui l'utente cerca di confermare la prenotazione, quando lo fa la funzione viene richiamata e il server inizia a fare tutti i controlli definiti dalla stessa 
    if (!req.session.utenteId) {

        return res.status(401).json({
            messaggio:
                'Devi effettuare il login per prenotare.'
        });

    }


    const {
        salaId,
        data,
        fasciaOraria
    } = req.body;


    if (
        !salaId ||
        !data ||
        !fasciaOraria
    ) {

        return res.status(400).json({
            messaggio:
                'Seleziona una sala, una data e una fascia oraria.'
        });

    }


    /*
     * Controlliamo che la data e l'orario
     * non siano già passati.
     */


// Controllo formato della data
if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({
        messaggio: 'Data non valida.'
    });
}

const [anno, mese, giorno] =
    data.split('-').map(Number);

// Controllo che la data esista realmente
const dataControllo =
    new Date(anno, mese - 1, giorno);

if (
    dataControllo.getFullYear() !== anno ||
    dataControllo.getMonth() !== mese - 1 ||
    dataControllo.getDate() !== giorno
) {
    return res.status(400).json({
        messaggio: 'Data non valida.'
    });
}

// Controllo fascia oraria
const fasceConsentite = [
    '09:00-11:00',
    '11:00-13:00',
    '14:00-16:00',
    '16:00-18:00'
];

if (!fasceConsentite.includes(fasciaOraria)) {
    return res.status(400).json({
        messaggio: 'Fascia oraria non valida.'
    });
}

const oraInizio =
    fasciaOraria.split('-')[0];

const [ore, minuti] =
    oraInizio.split(':').map(Number);

const dataPrenotazione =
    new Date(
        anno,
        mese - 1,
        giorno,
        ore,
        minuti
    );

const adesso =
    new Date();

// La prenotazione deve essere nel futuro
if (dataPrenotazione <= adesso) {
    return res.status(400).json({
        messaggio:
            'Non puoi prenotare una data o un orario passato.'
    });
}

    const querySala = `
        SELECT id
        FROM sale
        WHERE id = ?
    `;


    database.query(                     //Controllo che la sala effettivamente esista 
        querySala,
        [salaId],
        (err, sale) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    messaggio:
                        'Errore durante il controllo della sala.'
                });

            }


            if (sale.length === 0) {

                return res.status(404).json({
                    messaggio:
                        'La sala selezionata non esiste.'
                });

            }

            const queryControllo = `
                SELECT id
                FROM prenotazioni
                WHERE sala_id = ?
                AND data = ?
                AND fascia_oraria = ?
            `;


            database.query(                                    //Una volta passati i controlli di esistenza della sala bisogna anche verificare la disponibilità della stessa 
                queryControllo,
                [
                    salaId,
                    data,
                    fasciaOraria
                ],
                (err, risultati) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            messaggio:
                                'Errore durante il controllo della disponibilità.'
                        });

                    }


                    if (risultati.length > 0) {                                           //Dovesse essere già prenotata la sala blocco la prenotazione 

                        return res.status(400).json({
                            messaggio:
                                'La sala è già prenotata per questa fascia oraria.'
                        });

                    }

                    const queryInserimento = `
                        INSERT INTO prenotazioni
                        (
                            utente_id,
                            sala_id,
                            data,
                            fascia_oraria
                        )
                        VALUES (?, ?, ?, ?)
                    `;


                    database.query(                           //Vado ad inserire la prenotazione della sala all'intenro del database 
                        queryInserimento,
                        [
                            req.session.utenteId,
                            salaId,
                            data,
                            fasciaOraria
                        ],
                        (err, risultato) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({
                                    messaggio:
                                        'Errore durante il salvataggio della prenotazione.'
                                });

                            }


                            console.log(
                                'Prenotazione inserita:',
                                risultato.insertId
                            );


                            res.status(201).json({
                                messaggio:
                                    'Sala prenotata con successo!'
                            });

                        }
                    );

                }
            );

        }
    );

});

app.get('/api/prenotazioni/disponibilita', (req, res) => {           //La seguente funzione viene richiamata nel momento in cui l'utente seleziona una data, allora a quel punto vengono verificate le disponibilità di orario per il medesimo giorno 

    if (!req.session.utenteId) {

        return res.status(401).json({
            messaggio: 'Devi effettuare il login.'
        });
    }

    const salaId =
        req.query.sala;

    const data =
        req.query.data;


    if (!salaId || !data) {

        return res.status(400).json({
            messaggio:
                'Sala o data non specificate.'
        });
    }


    const query = `
        SELECT fascia_oraria
        FROM prenotazioni
        WHERE sala_id = ?
        AND data = ?
    `;


    database.query(
        query,
        [salaId, data],
        (err, risultati) => {

            if (err) {

                console.error(
                    'Errore disponibilità:',
                    err
                );

                return res.status(500).json({
                    messaggio:
                        'Errore nel controllo della disponibilità.'
                });
            }


            res.json(risultati);
        }
    );
});

app.get('/api/prenotazioni', (req, res) => {             //Funzione che serve a recuperare dal database, dopo che che l'utente abbia fatto il login, le prenotazioni che sono state fatte da quest'ultimo 

    if (!req.session.utenteId) {

        return res.status(401).json({
            messaggio: 'Devi effettuare il login.'
        });
    }
                                       
    const query = `    
        SELECT
            prenotazioni.id,
            DATE_FORMAT(prenotazioni.data, '%Y-%m-%d') AS data,
            prenotazioni.fascia_oraria,
            sale.nome AS nome_sala,
            sale.capienza
        FROM prenotazioni
        INNER JOIN sale                              
            ON prenotazioni.sala_id = sale.id
        WHERE prenotazioni.utente_id = ?
        ORDER BY
            prenotazioni.data,
            prenotazioni.fascia_oraria
    `;                                     //La "JOIN" che viene utilizzata sopra serve a mettere insieme dati che sono collegati tra loro ma che si trovano su tabelle diverse
                                           //ad esempio in tabelle in cui ho solo l'id della sala ma non il nome della stessa, tramite l'id prende il nome 
    database.query(
        query,
        [req.session.utenteId],
        (err, risultati) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    messaggio:
                        'Errore nel recupero delle prenotazioni.'
                });
            }

            console.log(
                'Prenotazioni trovate:',
                risultati
            );

            res.json(risultati);
        }
    );
});

app.delete('/api/prenotazioni/:id', (req, res) => {                   //Funzione che viene utilizzata per la cancellazione di prenotazioni, quindi si attiva quando l'utente clicca "cancella prenotazione"

    if (!req.session.utenteId) {

        return res.status(401).json({
            messaggio:
                'Devi effettuare il login.'
        });
    }


    const prenotazioneId =
        req.params.id;


    // Prima recuperiamo la prenotazione, e ovviamente si fa un verifica per vedere se effettivamente quella prenotazione e di quell'utente 
    const queryControllo = `
        SELECT data, fascia_oraria
        FROM prenotazioni
        WHERE id = ?
        AND utente_id = ?
    `;


    database.query(                               //Si fa un controllo per vedere se effettivamente esiste la prenotazione che si sta cercando di cancellare, e naturalmente che appartenga anche a quel determinato utente 
        queryControllo,
        [
            prenotazioneId,
            req.session.utenteId
        ],
        (err, risultati) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    messaggio:
                        'Errore durante il controllo della prenotazione.'
                });
            }


            if (risultati.length === 0) {

                return res.status(404).json({
                    messaggio:
                        'Prenotazione non trovata.'
                });
            }


            const prenotazione =
                risultati[0];


            const oggi =
                new Date();


            const dataPrenotazione =
                new Date(
                    prenotazione.data +
                    'T00:00:00'
                );


            // Se la data è già passata
            if (dataPrenotazione < oggi) {

                return res.status(400).json({
                    messaggio:
                        'Non puoi annullare una prenotazione già conclusa.'
                });
            }


            // Se la prenotazione è oggi,
            // controlliamo anche l'orario
            if (
                dataPrenotazione.toDateString() ===
                oggi.toDateString()
            ) {

                const oraInizio =
                    prenotazione.fascia_oraria
                        .split('-')[0];


                const [ore, minuti] =
                    oraInizio.split(':');


                const minutiInizio =                 //Serve semplicemente a trasformare l'orario in numero facile da controllare 
                    parseInt(ore) * 60 +
                    parseInt(minuti);


                const minutiAttuali =       
                    oggi.getHours() * 60 +
                    oggi.getMinutes();


                if (
                    minutiInizio <=
                    minutiAttuali
                ) {

                    return res.status(400).json({                 //Chiaramente non si può annullare la prenotazione di una sala in una data passata e in un orario passato o in corso 
                        messaggio:
                            'Non puoi annullare una prenotazione già iniziata o conclusa.'
                    });
                }
            }


            // Se arriviamo qui,
            // possiamo eliminare la prenotazione
            const queryDelete = `
                DELETE FROM prenotazioni
                WHERE id = ?
                AND utente_id = ?
            `;


            database.query(
                queryDelete,
                [
                    prenotazioneId,
                    req.session.utenteId
                ],
                (err, risultato) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            messaggio:
                                'Errore durante l\'annullamento.'
                        });
                    }


                    res.json({
                        messaggio:
                            'Prenotazione annullata con successo.'
                    });
                }
            );
        }
    );
});

app.get('/api/sessione', (req, res) => {           //Serve per capire se l'utente è autenticato,e in caso affermativo che ruolo abbia

    if (!req.session.utenteId) {

        return res.json({
            autenticato: false
        });
    }

    res.json({
        autenticato: true,
        utenteId: req.session.utenteId,
        ruolo: req.session.ruolo
    });
});

app.get(                                      //Permette all'admin di vedere tutte le prenotazioni che sono state fatte 
    '/api/admin/prenotazioni',
    controllaAdmin,
    (req, res) => {

        const query = `
            SELECT
                prenotazioni.id,
                DATE_FORMAT(prenotazioni.data, '%Y-%m-%d') AS data,
                prenotazioni.fascia_oraria,
                utenti.nome,
                utenti.cognome,
                utenti.email,
                sale.nome AS nome_sala,
                sale.capienza
            FROM prenotazioni
            INNER JOIN utenti
                ON prenotazioni.utente_id = utenti.id
            INNER JOIN sale
                ON prenotazioni.sala_id = sale.id
            ORDER BY
                prenotazioni.data,
                prenotazioni.fascia_oraria
        `;
                                                 //Come per la funzione di prima vengono usati vari inneri join perchè l'admin deve poter vedere le informazioni complete e non con i vari id 
        database.query(
            query,
            (err, risultati) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        messaggio:
                            'Errore nel recupero delle prenotazioni.'
                    });
                }

                res.json(risultati);
            }
        );
    }
);

app.delete(                                //Permette all'admin di andare a cancellare qualsiasi prenotazione, salvo per casi particolari
    '/api/admin/prenotazioni/:id',
    controllaAdmin,
    (req, res) => {

        const id =
            req.params.id;

        const query = `
            DELETE FROM prenotazioni
            WHERE id = ?
        `;

        database.query(
            query,
            [id],
            (err, risultato) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        messaggio:
                            'Errore durante l\'eliminazione.'
                    });
                }

                if (risultato.affectedRows === 0) {

                    return res.status(404).json({
                        messaggio:
                            'Prenotazione non trovata.'
                    });
                }

                res.json({
                    messaggio:
                        'Prenotazione eliminata con successo.'
                });
            }
        );
    }
);

app.get(
    '/api/admin/sale',
    controllaAdmin,
    (req, res) => {

        const query = `
            SELECT *
            FROM sale
            ORDER BY id
        `;

        database.query(
            query,
            (err, risultati) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        messaggio:
                            'Errore nel recupero delle sale.'
                    });
                }

                res.json(risultati);
            }
        );
    }
);

app.post(                            //Funzione che può essere utilizzata solo da un utente loggato come admin, permette la creazione di nuove sale
    '/api/admin/sale',
    controllaAdmin,
    (req, res) => {

        const {
            nome,
            capienza
        } = req.body;


        if (!nome || !capienza) {

            return res.status(400).json({
                messaggio:
                    'Inserisci nome e capienza della sala.'
            });
        }


        const capienzaNumero =
            Number(capienza);


        if (
            !Number.isInteger(capienzaNumero) ||
            capienzaNumero <= 0
        ) {

            return res.status(400).json({
                messaggio:
                    'La capienza deve essere un numero intero positivo.'
            });
        }


        const query = `
            INSERT INTO sale
            (nome, capienza)
            VALUES (?, ?)
        `;


        database.query(
            query,
            [
                nome.trim(),
                capienzaNumero
            ],
            (err, risultato) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        messaggio:
                            'Errore durante la creazione della sala.'
                    });
                }

                res.status(201).json({
                    messaggio:
                        'Sala creata con successo.',
                    id:
                        risultato.insertId
                });
            }
        );
    }
);

app.delete(                                //Funzione utilizzabile sempre dall'admin, serve per cancellare delle sale 
    '/api/admin/sale/:id',
    controllaAdmin,
    (req, res) => {

        const id =
            req.params.id;

                                            //Prima dell'effettiva cancellazione si controlla se la stanza in questione ha qualche prenotazione, in caso affermativo si blocca l'eliminazione
        const controllo = ` 
            SELECT id
            FROM prenotazioni
            WHERE sala_id = ?
        `;


        database.query(
            controllo,
            [id],
            (err, risultati) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        messaggio:
                            'Errore durante il controllo della sala.'
                    });
                }


                if (risultati.length > 0) {

                    return res.status(400).json({
                        messaggio:
                            'Non puoi eliminare una sala che ha delle prenotazioni.'
                    });
                }


                database.query(
                    `
                    DELETE FROM sale
                    WHERE id = ?
                    `,
                    [id],
                    (err, risultato) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                messaggio:
                                    'Errore durante l\'eliminazione della sala.'
                            });
                        }


                        if (
                            risultato.affectedRows === 0
                        ) {

                            return res.status(404).json({
                                messaggio:
                                    'Sala non trovata.'
                            });
                        }


                        res.json({
                            messaggio:
                                'Sala eliminata con successo.'
                        });
                    }
                );
            }
        );
    }
);

app.get(                                      //Sempre utilizzabile dall'admin, serve per poter far visualizzare a quest'ultimo gli utenti registrati 
    '/api/admin/utenti',
    controllaAdmin,
    (req, res) => {

        const query = `
            SELECT
                id,
                nome,
                cognome,
                email,
                ruolo
            FROM utenti
            ORDER BY cognome, nome
        `;


        database.query(
            query,
            (err, risultati) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        messaggio:
                            'Errore nel recupero degli utenti.'
                    });
                }

                res.json(risultati);
            }
        );
    }
);


app.get('/api/profilo', (req, res) => {                                   //Serve per recuperare i dati dell'utente attualmente loggato   
 
    if (!req.session.utenteId) {                                      //Il server non chiede l'id al frontend ma bensì lo prende direttamente dalla sessione 

        return res.status(401).json({
            messaggio:
                'Devi effettuare il login.'
        });

    }


    const query = `
        SELECT
            id,
            nome,
            cognome,
            email,
            ruolo
        FROM utenti
        WHERE id = ?
    `;


    database.query(
        query,
        [req.session.utenteId],
        (err, risultati) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    messaggio:
                        'Errore nel recupero del profilo.'
                });

            }


            if (risultati.length === 0) {

                return res.status(404).json({
                    messaggio:
                        'Utente non trovato.'
                });

            }


            res.json(
                risultati[0]
            );

        }
    );

});

const PORT = 3000;                                            //Porta del server 

app.listen(PORT, () => {                                      //Praticamente dice ad Express "mettiti in ascolto sulla porta che ti ho indicato"
    console.log(`Server avviato sulla porta ${PORT}`);
}); 