//Questo file gestisce la pagina dove l'utente sceglie la data e la fascia oraria per la prenotazione della sala 

const parametri =
    new URLSearchParams(window.location.search);

const salaId =                         //Praticamente serve per prendere il valore del parametro chiamato sala, quindi fondamentalmente il numero della sala 
    parametri.get('sala');

    if (!salaId) {

    alert(                               //Se non si trova l'id della sala si torna alla scelta della stessa 
        'Nessuna sala selezionata.'
    );

    window.location.href =
        'sale.html';
}
                                             //Tutte queste righe successivi simile servono a far andare JavaScript nell'HTML e recuperare le iniformazioni con quei id 
const informazioniSala =
    document.getElementById('informazioniSala');

const form =
    document.getElementById('formPrenotazione');

const messaggio =
    document.getElementById('messaggio');

const dataInput =
    document.getElementById('data');

const fasciaSelect =
    document.getElementById('fasciaOraria');

// Impedisce di scegliere una data passata
const oggi = new Date();                         //Creo un oggeto che rappresenti data e ora attuali 

const anno =
    oggi.getFullYear();

const mese =
    String(oggi.getMonth() + 1).padStart(2, '0');

const giorno =
    String(oggi.getDate()).padStart(2, '0');

const dataMinima =                                  //Grazie alle informazioni sopra ricavate viene calcolata la data minima che verrà usata sotto, fa in modo che non si possa prenotare una data e/o orario passato 
    `${anno}-${mese}-${giorno}`;

dataInput.min =           
    dataMinima;

// Carica le informazioni della sala
async function caricaSala() {                       //Serve per mostrare le informazioni della sala scelta 

    try {

        const risposta =                          //Chiede al server tutte le sale 
            await fetch('/api/sale');

        const sale =
            await risposta.json();                 //E trasforma la risposta in dati JavaScript 

        const sala =                                //Cerca nell'array la sala che corrisponde all'id scelto 
            sale.find(s => s.id == salaId);

        if (!sala) {

            informazioniSala.textContent =
                'Sala non trovata.';

            return;
        }

        informazioniSala.innerHTML = `
            <h2>${sala.nome}</h2>

            <p>
                Capienza: ${sala.capienza} persone
            </p>
        `;

    } catch (errore) {

        console.error(errore);

        informazioniSala.textContent =
            'Errore nel caricamento della sala.';
    }
}


// Controlla quali fasce sono disponibili
async function controllaDisponibilita() {         //In pratica controlla quale fascie orarie siano ancora disponibili 
    const data = dataInput.value;

    if (!data) {
        return;
    }

    // Prima riabilito tutte le fasce
    // così non rimangono bloccate dalla data precedente
    for (const opzione of fasciaSelect.options) {
        opzione.disabled = false;

        if (opzione.value === '') {
            opzione.textContent =
                'Seleziona una fascia';
        } else {
            opzione.textContent =
                opzione.value.replace('-', ' - ');
        }
    }

                                                            // Controllo se la data selezionata è oggi
    const oggi = new Date();

    const dataSelezionata =
        new Date(data + 'T00:00:00');

    const annoOggi =
        oggi.getFullYear();

    const meseOggi =
        String(oggi.getMonth() + 1).padStart(2, '0');

    const giornoOggi =
        String(oggi.getDate()).padStart(2, '0');

    const dataOggi =
        `${annoOggi}-${meseOggi}-${giornoOggi}`;

                                                             // Se la data è oggi, controllo l'orario
    if (data === dataOggi) {

        const minutiAttuali =
            oggi.getHours() * 60 +
            oggi.getMinutes();

        for (const opzione of fasciaSelect.options) {

            if (opzione.value === '') {
                continue;
            }

            const oraInizio =
                opzione.value.split('-')[0];

            const [ore, minuti] =
                oraInizio.split(':');

            const minutiInizio =
                parseInt(ore) * 60 +
                parseInt(minuti);

            if (minutiInizio <= minutiAttuali) {
                opzione.disabled = true;
                opzione.textContent =
                    `${opzione.value.replace('-', ' - ')} - ORARIO PASSATO`;
            }
        }
    }

    // Controllo le prenotazioni già presenti
    try {
        const risposta =
            await fetch(
                `/api/prenotazioni/disponibilita?sala=${salaId}&data=${data}`           //Il server cerca nel database le prenotazioni già presenti per quella data e per quell'orario 
            );

        const risultati =
            await risposta.json();

        if (!risposta.ok) {
            console.error(risultati.messaggio);
            return;
        }

        risultati.forEach(prenotazione => {

            for (const opzione of fasciaSelect.options) {

                if (
                    opzione.value ===
                    prenotazione.fascia_oraria
                ) {
                    opzione.disabled = true;                         //Questo e le 2 righe dopo sono quelle che fanno capire all'utente, durante la visualizzazione, quali sale sono già state prenotate 

                    opzione.textContent =
                        `${opzione.value.replace('-', ' - ')} - GIÀ PRENOTATA`;
                }
            }
        });

                                                             // Se la fascia selezionata è stata disabilitata,
                                                            // la tolgo dalla selezione
        if (
            fasciaSelect.selectedOptions.length > 0 &&
            fasciaSelect.selectedOptions[0].disabled
        ) {
            fasciaSelect.value = '';
        }

    } catch (errore) {

        console.error(
            'Errore controllo disponibilità:',
            errore
        );
    }
}

                                                                  // Quando cambio la data,
                                                                  // controlliamo nuovamente la disponibilità
dataInput.addEventListener(.                         //Ogni volta che l'utente cambia la data nella sala che vuole prenotare vado a rifare il controllo della disponibilità
    'change',
    controllaDisponibilita
);


// Invio della prenotazione
form.addEventListener(                      //Si entra in questa sezione nel momento in cui l'utente pigia il bottone "conferma" sulla prenotazione 
    'submit',
    async (event) => {

        event.preventDefault();          //Blocca il normale comportamento del form, verrà gestito tramite JavaScript 

        const data =                               //Questa riga e quella successivo serva per recuperare i dati che servono alla prenotazione
            dataInput.value;

        const fasciaOraria =
            fasciaSelect.value;


        if (!data || !fasciaOraria) {

            messaggio.textContent =
                'Seleziona una data e una fascia oraria.';

            return;
        }

        const dataSelezionata =
        new Date(data + 'T00:00:00');

        const oggiControllo =
        new Date();                     //Contiene data + ora attuale 

        oggiControllo.setHours(           //Serve per azzerare a 0 ore, minuti, secondi e millisecondi della data attuale, così che successivamente possa fare un controllo solo sulla date senza considerare l'orario 
           0,
           0,
           0,
           0
         );


if (dataSelezionata < oggiControllo) {

    messaggio.textContent =
        'Non puoi prenotare una data passata.';

    return;
}

        try {
                                                       //Javascript prende i dati e li manda al server, POST è quello che fa capire l'invio 
            const risposta =
                await fetch(
                    '/api/prenotazioni',
                    {

                        method: 'POST',

                        headers: {                       //Serce per dire al server che i dati che sto inviando sono in formato json 
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({             //Questo pezzo nello specifico lo trasforma nella strnga JSON da inviare nella richiesta HTTP

                            salaId:
                                salaId,

                            data:
                                data,

                            fasciaOraria:
                                fasciaOraria
                        })
                    }
                );


            const risultato =
                await risposta.json();           //Si aspetta la risposta dal server

            messaggio.textContent =               //Mostra la risposta del server 
                risultato.messaggio;

                setTimeout(                             //Va a cancellare il messagio dopo 5 secondi 
                    () => {
                        messaggio.textContent = '';
                    },
                  5000
                );


            if (risposta.ok) {

                // Prenotazione riuscita
                messaggio.style.fontWeight =
                    'bold';

                                                          // Aggiorniamo subito le fasce disponibili
                await controllaDisponibilita();

                // Reset del form
                fasciaSelect.value = '';

            } else {

                // Prenotazione rifiutata
                messaggio.style.fontWeight =
                    'bold';
            }


        } catch (errore) {

            console.error(errore);

            messaggio.textContent =
                'Errore di comunicazione con il server.';
        }

    }
);


// Avvio
caricaSala(); 