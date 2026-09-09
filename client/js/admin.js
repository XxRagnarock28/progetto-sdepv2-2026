//Queste 5 righe con "const" sottostanti vanno a dire a JavaScript di darmi i riferimenti agli elementi HTML che mi serviranno successivamente 

const listaPrenotazioni =
    document.getElementById(
        'listaPrenotazioniAdmin'
    );

const listaSale =
    document.getElementById(
        'listaSaleAdmin'
    );

const listaUtenti =
    document.getElementById(
        'listaUtentiAdmin'
    );

const formSala =
    document.getElementById(
        'formNuovaSala'
    );

const messaggio =
    document.getElementById(
        'messaggioAdmin'
    );


// =====================================
// CONTROLLO ACCESSO
// =====================================

async function controllaAccesso() {

    try {

        const risposta =                         //Javascript chiede al server "questa persona ha una sessione attiva?che ruolo ha?"
            await fetch('/api/sessione');


        const sessione =                     //Trasforma la risposta del server da JSON ad un'oggeto JavaScript
            await risposta.json();


        if (
            !sessione.autenticato ||                 //Se l'utente non è autenticato o non è admin non può entrare all'interno di questa pagina 
            sessione.ruolo !== 'admin'
        ) {

            alert(
                'Non hai i permessi per accedere a questa pagina.'
            );

            window.location.href =                   //Se non ha i permessi viene rimandato alla pagina principale 
                'index.html';

            return false;
        }


        document.body.style.display =             //Nel caso in cui in cui il controllo sia andato a buon fine rende visibile il body di admin.html
            'block';


        return true;


    } catch (errore) {

        console.error(
            'Errore controllo accesso:',
            errore
        );

        window.location.href =
            'index.html';

        return false;

    }

}

// =====================================
// PRENOTAZIONI
// =====================================

async function caricaPrenotazioni() {             //Serve a caricar tutte le prenotazioni presenti all'interno del sistema

    const risposta =
        await fetch(
            '/api/admin/prenotazioni'             //A diferrenza della chiamata sul file "prenotazioni.js", quindi metto anche "/admin" poi quest'ultimo deve poter vedere tutte le prenotazioni
        );

    const dati =                                  //Conterrà un'array di prenotazioni 
        await risposta.json();


    if (!risposta.ok) {

        listaPrenotazioni.innerHTML =
            `<p>${dati.messaggio}</p>`;

        return;
    }


    if (dati.length === 0) {                               //Visto che l'array contiene le prenotazioni, se quest'ultimo ha lungezza 0, allora non ci sono prenotazioni 

        listaPrenotazioni.innerHTML =
            '<p>Nessuna prenotazione presente.</p>';

        return;
    }


    listaPrenotazioni.innerHTML = '';                   //Serve per svuotare il contenitore prima di andare ad inserire nuove prenotazioni


    dati.forEach(prenotazione => {                      //Vado a far vedere ogni sala prenotata con le varie informazioni del caso 

        const elemento =
            document.createElement('div');


        elemento.innerHTML = `

            <h3>
                ${prenotazione.nome_sala}
            </h3>

            <p>
                Utente:
                ${prenotazione.nome}
                ${prenotazione.cognome}
            </p>

            <p>
                Email:
                ${prenotazione.email}
            </p>

            <p>
                Data:
                ${prenotazione.data}
            </p>

            <p>
                Fascia:
                ${prenotazione.fascia_oraria}
            </p>

            <button
                onclick="eliminaPrenotazione(
                    ${prenotazione.id}
                )"
            >
                Elimina prenotazione                      
            </button>
                
            <hr>
        `;
                                                       //Inserisco anche un bottone per eliminare la prenotazione

        listaPrenotazioni.appendChild(
            elemento
        );
    });
}


// =====================================
// ELIMINA PRENOTAZIONE
// =====================================

async function eliminaPrenotazione(id) {                          //Questa funzione viene chiamata quando l'admin clicca sul pulsante. Id raopresenta l'id della sala da eliminare 

    const conferma =
        confirm(
            'Sei sicuro di voler eliminare questa prenotazione?'
        );


    if (!conferma) {
        return;
    }


    const risposta =
        await fetch(                          
            `/api/admin/prenotazioni/${id}`,
            {                                         //Qui si usa delete perché voglio andare ad eliminare una risorsa. Quindi il server ottiene l'id della prenotazione da andare ad eliminare 
                method: 'DELETE'
            }
        );


    const risultato =
        await risposta.json();


    alert(
        risultato.messaggio
    );


    if (risposta.ok) {                        //Se andato tutto bene devo andare ad aggiornare la lista 

         await caricaPrenotazioni();
         await aggiornaStatistiche();
    }
}


// =====================================
// SALE
// =====================================

async function caricaSale() {

    const risposta =                       //Chiedo al server tutte le sale 
        await fetch(
            '/api/admin/sale'
        );

    const dati =                        //Ottengo l'array 
        await risposta.json();


    if (!risposta.ok) {

        listaSale.innerHTML =
            `<p>${dati.messaggio}</p>`;

        return;
    }


    if (dati.length === 0) {

        listaSale.innerHTML =
            '<p>Nessuna sala presente.</p>';

        return;
    }


    listaSale.innerHTML = '';


    dati.forEach(sala => {

        const elemento =
            document.createElement('div');


        elemento.innerHTML = `

            <h3>
                ${sala.nome}
            </h3>

            <p>
                Capienza:
                ${sala.capienza}
                persone
            </p>

            <button
                onclick="eliminaSala(${sala.id})"
            >
                Elimina sala
            </button>

            <hr>
        `;


        listaSale.appendChild(          //Sostanzialmente serve perchè ogni volta che vado a cancellare una sala per la visualizzazione HTML devo andare a rimetterle tutte 
            elemento                      //In pratica si vanno a ricaricare i dati e si crea una nuova lista 
        );
    });
}


// =====================================
// AGGIUNGI SALA
// =====================================

formSala.addEventListener(               //Quando il form per aggiungere una sala viene inviaito esegui il seguente codice
    'submit',
    async (event) => {

        event.preventDefault();             //Blocca l'invio di default del form, così posso andare a gestirlo con JavaScript


        const nome =
            document.getElementById(          //Prende il campo HTML
                'nomeSala'
            ).value.trim();                //Prende ciò che l'utente ha scritto rimuovendo gli spazi all'inizio e alla fine grazie a "trim"


        const capienza =                          //Prende il valore del campo "capienza"
            document.getElementById(
                'capienzaSala'
            ).value;

        if (
            nome === '' ||
            capienza <= 0
           ) {

               messaggio.textContent =
              'Inserisci un nome e una capienza valida.';

              return;
             }    

        const risposta =                     //Se è tutto corretto vado ad inviare i dati al server per la creazione della nuova sala 
            await fetch(
                '/api/admin/sale',
                {

                    method: 'POST',

                    headers: {                     //Dico al server che i dati che gli stanno venendo mandati sono in formato JSON 
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({            //Trasforma l'oggetto JavaScript in una stringa json 
                        nome: nome,
                        capienza: capienza
                    })
                }
            );


        const risultato =
            await risposta.json();


        messaggio.textContent =
            risultato.messaggio;
        
        setTimeout(                                           //Cancello il messaggio dopo 3 secondi 
            () => {
                messaggio.textContent = '';
            },
            3000
        );

        if (risposta.ok) {                          //Se è andato tutto bene

            formSala.reset();                       //Svuoto il form 
            await caricaSale();                     //Ricarico la lista delle sale 
            await aggiornaStatistiche();            //Aggiorno il numero della sale 
        }
    }
);


// =====================================
// ELIMINA SALA
// =====================================

async function eliminaSala(id) {                               //Molto simile alla cancellazione di una prenotazione

    const conferma =
        confirm(
            'Sei sicuro di voler eliminare questa sala?'
        );


    if (!conferma) {
        return;
    }


    const risposta =
        await fetch(
            `/api/admin/sale/${id}`,             //Mando il "DELETE" al server, tipo "cancella la sala con id 3"
            {
                method: 'DELETE'
            }
        );


    const risultato =
        await risposta.json();


    alert(
        risultato.messaggio
    );


    if (risposta.ok) {

      await caricaSale();
      await aggiornaStatistiche();
    }
}


// =====================================
// UTENTI
// =====================================

async function caricaUtenti() {                   //Serve a mostrare gli utenti registrati

    const risposta =                              //Il server restituisce gli utenti registrati 
        await fetch(
            '/api/admin/utenti'
        );


    const dati =
        await risposta.json();


    if (!risposta.ok) {

        listaUtenti.innerHTML =
            `<p>${dati.messaggio}</p>`;

        return;
    }


    listaUtenti.innerHTML = '';


    dati.forEach(utente => {                      //Passo gli utenti 1 alla volta e ci creo un div 

        const elemento =
            document.createElement('div');

                                                 //Queste sotto sono tutte informazioni dell'utente che l'admin può effettivamente controllare 
        elemento.innerHTML = `

            <p>
                <strong>
                    ${utente.nome}
                    ${utente.cognome}
                </strong>

                <br>

                Email:
                ${utente.email}

                <br>

                Ruolo:
                ${utente.ruolo}
            </p>

            <hr>
        `;

                                              //Inserisce l'utente nella pagina 
        listaUtenti.appendChild(
            elemento
        );
    });
}


// =====================================
// AVVIO
// =====================================

async function avviaPagina() {                          //La funzione che coordina tutto 

    const autorizzato =
        await controllaAccesso();

                                       //Si controlla se l'utente può entrare, quindi se non è admin blocca tutto altrimenti carica tutto 
    if (!autorizzato) {
        return;
    }


    await caricaPrenotazioni();

    await caricaSale();

    await caricaUtenti();

    await aggiornaStatistiche();

}

async function aggiornaStatistiche() {            //Mostra i numeri in alto nella pagina 

    try {
                                            //Recupera informazioni su tutte le prenotazioni, tutte le sale e tutti gli utenti 
        const prenotazioni =
            await fetch(
                '/api/admin/prenotazioni'
            );

        const sale =
            await fetch(
                '/api/admin/sale'
            );

        const utenti =
            await fetch(
                '/api/admin/utenti'
            );

                                              //Converto tutte le risposte, così posso utilizzare length 
        const datiPrenotazioni =
            await prenotazioni.json();

        const datiSale =
            await sale.json();

        const datiUtenti =
            await utenti.json();

                                              //Queste sotto mettono i numeri nell'elemento HTML 
        document.getElementById(
            'numeroPrenotazioni'
        ).textContent =
            datiPrenotazioni.length;


        document.getElementById(
            'numeroSale'
        ).textContent =
            datiSale.length;


        document.getElementById(
            'numeroUtenti'
        ).textContent =
            datiUtenti.length;


    } catch (errore) {

        console.error(
            errore
        );

    }

}

avviaPagina();                //Quando viene caricato admin.js tutto il programma parte da qui 