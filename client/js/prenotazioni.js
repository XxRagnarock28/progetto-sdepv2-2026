const listaPrenotazioni =
    document.getElementById('listaPrenotazioni');


function prenotazioneNelFuturo(prenotazione) {

    const oggi = new Date();

    const data =
        new Date(prenotazione.data + 'T00:00:00');

    if (data > oggi) {                                //Controlla se la prenotazione è futura, in quel caso sarebbe attiva 
        return true;
    }

                                               // Se la data è passata, non è più attiva
    if (data < oggi) {
        return false;
    }

                                                           // Se è oggi controlliamo anche l'orario
    const oraInizio =
        prenotazione.fascia_oraria.split('-')[0];

    const [ore, minuti] =
        oraInizio.split(':');

    const minutiInizio =
        parseInt(ore) * 60 +
        parseInt(minuti);

    const minutiAttuali =
        oggi.getHours() * 60 +
        oggi.getMinutes();

    return minutiInizio > minutiAttuali;
}


async function caricaPrenotazioni() {

    try {

        const risposta =
            await fetch('/api/prenotazioni');           //Il backend restituisce le prenotazioni dell'utente attualmente loggato 

        const dati =
            await risposta.json();

        if (!risposta.ok) {

            listaPrenotazioni.innerHTML = `
                <p>${dati.messaggio}</p>
            `;

            return;
        }


        if (!Array.isArray(dati) || dati.length === 0) {

            listaPrenotazioni.innerHTML = `
                <p>
                    Non hai ancora effettuato prenotazioni.
                </p>
            `;

            return;
        }


        listaPrenotazioni.innerHTML = '';


        const future =               
            dati.filter(prenotazione =>                        //"Filter" serve per andare a creare un array con elemento che rispettino solo determinate condizioni 
                prenotazioneNelFuturo(prenotazione)
            );
                                                               //Vado a creare 2 array per separare le prenotazioni future da quella passate 
                                                               //Le ho divise per avere un'interfaccia più ordinata 
        const passate =
            dati.filter(prenotazione =>
                !prenotazioneNelFuturo(prenotazione)
            );


        // =========================
        // PRENOTAZIONI FUTURE
        // =========================

        if (future.length > 0) {

            const titolo =
                document.createElement('h2');

            titolo.textContent =
                'Prenotazioni future';

            listaPrenotazioni.appendChild(titolo);


            future.forEach(prenotazione => {

                mostraPrenotazione(
                    prenotazione,
                    true
                );
            });
        }


        // =========================
        // PRENOTAZIONI PASSATE
        // =========================

        if (passate.length > 0) {

            const titolo =
                document.createElement('h2');

            titolo.textContent =
                'Prenotazioni passate';

            listaPrenotazioni.appendChild(titolo);


            passate.forEach(prenotazione => {

                mostraPrenotazione(
                    prenotazione,
                    false
                );
            });
        }


    } catch (errore) {

        console.error(errore);

        listaPrenotazioni.innerHTML = `
            <p>
                Errore nel caricamento delle prenotazioni.
            </p>
        `;
    }
}


function mostraPrenotazione(                            //Configura la visualizzazioen della sale prenotate, con tutti gli elementi necessari 
    prenotazione, 
    attiva
) {

    const elemento =
        document.createElement('div');


    elemento.innerHTML = `

        <h3>
            ${prenotazione.nome_sala}
        </h3>

        <p>
            Capienza:
            ${prenotazione.capienza}
            persone
        </p>

        <p>
            Data:
            ${prenotazione.data}
        </p>

        <p>
            Fascia oraria:
            ${prenotazione.fascia_oraria}
        </p>

    `;


    if (attiva) {                                           //Nel caso in cui la prenotazione sia ancora attivata vado a creare il bottone che permetta all'utente di annullarla 

        const pulsante =
            document.createElement('button');

        pulsante.textContent =
            'Annulla prenotazione';

        pulsante.addEventListener(
            'click',
            () => {
                annullaPrenotazione(
                    prenotazione.id
                );
            }
        );

        elemento.appendChild(pulsante);

    } else {

        const stato =
            document.createElement('p');

        stato.textContent =
            'Prenotazione conclusa';

        elemento.appendChild(stato);
    }


    const separatore =
        document.createElement('hr');

    elemento.appendChild(separatore);

    listaPrenotazioni.appendChild(elemento);
}


async function annullaPrenotazione(id) {

    const conferma =
        confirm(
            'Sei sicuro di voler annullare questa prenotazione?'
        );


    if (!conferma) {
        return;
    }


    try {

        const risposta =
            await fetch(                             //Vado a chiedere al server di eliminari la prenotazione che l'utente vorrebbe eliminare 
                `/api/prenotazioni/${id}`,
                {
                    method: 'DELETE'
                }
            );


        const risultato =
            await risposta.json();


        alert(
            risultato.messaggio
        );


        if (risposta.ok) {                        //La lista viene ricaricata e la prenotazione appena eliminata scompare 

            caricaPrenotazioni();
        }


    } catch (errore) {

        console.error(errore);

        alert(
            'Errore durante l\'annullamento.'
        );
    }
}

async function controllaLogin() {

    try {

        const risposta =
            await fetch('/api/sessione');

        const sessione =
            await risposta.json();


        if (!sessione.autenticato) {

            alert(
                'Devi effettuare il login.'
            );

            window.location.href =
                'login.html';

            return false;
        }


        return true;


    } catch (errore) {

        console.error(errore);

        return false;

    }

}

async function avviaPagina() {            //Funzione che fa partire tutto 

    const autenticato =
        await controllaLogin();


    if (!autenticato) {
        return;
    }


    caricaPrenotazioni();

}


avviaPagina();