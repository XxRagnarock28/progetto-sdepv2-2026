async function caricaProfilo() {                     //Quando viene chiamata viene fatta una richiesta al server, il quale controlla la sessione e recupera dal database i dati dell'utente attualmente loggato 

    try {

        const risposta =
            await fetch('/api/profilo');


        const dati =
            await risposta.json();


        if (!risposta.ok) {                                      //Se è andato tutto bene procedo altrimenti blocco tutto 

            alert(
                dati.messaggio ||
                'Errore durante il caricamento del profilo.'
            );

            window.location.href =
                'login.html';

            return;
        }


        const contenitore =                    //Qui andrò ad inserire i dati dell'utente
            document.getElementById(
                'datiProfilo'                       
            );

                                                      //Permette di inserire HTML dentro ad un elemento 
        contenitore.innerHTML = `

            <p>
                <strong>Nome:</strong>
                ${dati.nome}                     
            </p>

            <p>
                <strong>Cognome:</strong>
                ${dati.cognome}
            </p>

            <p>
                <strong>Email:</strong>
                ${dati.email}
            </p>

            <p>
                <strong>Ruolo:</strong>
                ${dati.ruolo}
            </p>

        `;


    } catch (errore) {

        console.error(errore);

    }

}


async function logout() {       //Quando viene fatto la richiesta di logout il server distrugge la sessione dell'utente, quindi la sessione che lo vede come autenticato 

    const risposta =
        await fetch(
            '/api/logout',
            {
                method: 'POST'
            }
        );


    if (risposta.ok) {                   //Se il logout è andato bene mando l'utente alla pagina di login 

        window.location.href =
            'login.html';

    }

}


document
    .getElementById('logout')
    .addEventListener(
        'click',
        logout
    );


caricaProfilo();