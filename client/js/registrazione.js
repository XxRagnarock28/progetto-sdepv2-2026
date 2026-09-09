console.log("registrazione.js caricato");                               //Serve semplicemente per verificare dalla console del browser che il file JavaScript sia stato effettivamente caricato 
    
const form = document.getElementById('formRegistrazione');             //Form dove l'utente inserisce i dati 
const messaggio = document.getElementById('messaggio');

form.addEventListener('submit', async (event) => {                     //Serve a fargli eseguire questa funzione quando viene inviato il form 
                                                
    console.log("form inviato");                             //Controlla nuovamente che l'evento sia partito 

    event.preventDefault();                                          //Classico blocco del form normale HTML

    const nome = document.getElementById('nome').value;               //Queste 4 righe servono per prendere i 4 valori che l'utente ha inserito nel form 
    const cognome = document.getElementById('cognome').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {                                                             //Invio i dati al server per creare un nuovo utente 

        const risposta = await fetch('/api/registrazione', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'                   //I dati che mando al server sono json 
            },
            body: JSON.stringify({                         //Trasforma l'oggetto JavaScript in una stringa JSON, la quale potrà poi essere inviata 
                nome: nome,
                cognome: cognome,
                email: email,
                password: password
            })
        });

        const risultato = await risposta.json();          //Prende la risposta e da oggetto JavaScript la trasforma in JSON

        messaggio.textContent = risultato.messaggio;

    } catch (errore) {

        console.error(errore);
        messaggio.textContent = 'Errore di comunicazione con il server.';
    }
});