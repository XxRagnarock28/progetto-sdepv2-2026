//Generalemente questo file serve per verificare che l'utente sia loggato e recuperare l'elenco delle sale dal server per poi visualizzarlo nella pagina  

const listaSale =
    document.getElementById('listaSale');                 //Va nel file sale.html e cerca l'elemento che id = listaSale 


async function controllaLogin() {                 //La funzione serve a controllare se l'utente è effettivamente loggato 
                                                //"Async" permette di utilizzare operazioni asincrone all'interno della funzione,per esempio "await"
    try {

        const risposta =
            await fetch('/api/sessione');         //"Fetch" serve per fare una richiesta http al server 
                                                  //"Await" serve per aspettare la rispsota prima di andare avanti 
        const sessione =
            await risposta.json();                 //La risposta viene convertita in un json 


        if (!sessione.autenticato) {

            alert(
                'Devi effettuare il login per prenotare una sala.'
            );

            window.location.href =                     //Nel caso in cui l'utente non sia loggato viene spedito nella pagina per il login 
                'login.html';

            return false;                   //Il controllo non è andato a buon fine, quindi interrompo la funzione 
        }


        return true;

    } catch (errore) {

        console.error(errore);

        return false;
    }
}


async function caricaSale() {              //Ha il compito di cheidere al backend tutte le sale e mostrarle nella pagina 

    try {

        const risposta =
            await fetch('/api/sale');


        const sale =
            await risposta.json();


        if (!risposta.ok) {                                   //Controlla se la risposta http è andata a buon fine e risponde di conseguenza 

            listaSale.textContent =
                'Errore nel caricamento delle sale.';

            return;
        }


        listaSale.innerHTML = '';                            //Serve per cancellare il contenuto della precedente lista 


        if (                                           //Controlla se ci sono sale 
            !Array.isArray(sale) ||                    //Controlla che "sale" si affettivamente un array
            sale.length === 0                          //Controllo sulla dimensione dell'array
        ) {

            listaSale.innerHTML =
                '<p>Non ci sono sale disponibili.</p>';

            return;
        }


        sale.forEach(sala => {                        //Serve per scorrere ogni elemento dell'array, di conseguenza la funzione viene eseguita per ogni sala presente nell'array 

            const elemento =
                document.createElement('div');        //Va a creare qualcosa all'interno di sale.html, è come se mette un <div> ... <div>

                                                   //Nello spazio che ha creato nel codice sovrastante ci va a mettere il codice qui sottostante, è il pezzo di codice scritto sotto questo commento che si occupa di riempire il div  
            elemento.innerHTML = `        

                <h2>
                    ${sala.nome}
                </h2>

                <p>
                    Capienza:
                    ${sala.capienza}
                    persone
                </p>

                <button
                    onclick="prenotaSala(${sala.id})"
                >
                    Prenota
                </button>

                <hr>

            `;                                     //Quindi fondamentalmente i'impostazione su come si vedranno le sale è fatta così, però non è ancora visualizzabile 
                                               //In pratica è stato creato ma si trova ancora al di fuori della pagina 
              
            listaSale.appendChild(                 //Dice "prendi l'elemento che ho appena creato e mettilo dentro listaSale"
                elemento
            );

        });


    } catch (errore) {

        console.error(errore);

        listaSale.textContent =
            'Errore nel caricamento delle sale.';
    }
}


function prenotaSala(idSala) {                      //Funzione che serve a portare l'utente alla pagina di prenotazione passando l'id della sala nell'URL

    window.location.href =
        `prenotazione.html?sala=${idSala}`;         //Quindi la pagina successiva sa quale sala l'utente ha scelto, viene poi recuperato in prenotazione.js

}


async function avviaPagina() {              //Serve per coordinare tutto, controlla se l'utente è autenticato e in caso affermativo mostra le sale 

    const autenticato =
        await controllaLogin();


    if (!autenticato) {
        return;
    }


    caricaSale();

}


avviaPagina();