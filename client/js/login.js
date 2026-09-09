const form = document.getElementById('formLogin');                      //In questa riga e quella sotto recupero 2 elementi HTML
const messaggio = document.getElementById('messaggio');        //"Messaggio" rappresenta l'elemento dove voglio mostrare eventuali messaggi 

form.addEventListener('submit', async (event) =>{         //Quando l'utente invia il form di login esegue la seguente funzione 
                                                               //Il submit avviene quando l'utente clicca il bottone "login"
    event.preventDefault();                                           //Blocco il comportamento normale, come al solito, voglio farlo gestire da JavaScript
    const email = document.getElementById('email').value;            //Prendo l'email e la password
    const password = document.getElementById('password').value;

    try{

        const risposta = await fetch ('/api/login', {           //Invio al server 
            method: 'POST',
            headers: {                                         //Dico che sto inviando in formato JSON 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
    
     const risultato = await risposta.json();

    messaggio.textContent = risultato.messaggio;        //Mostro il messaggio, lo prendo e lo inserisco nell'elemento HTML "messaggio"
    }catch (errore)
           {
            console.error(errore);

            messaggio.textContent = 
              'Errore di comunicazione con il server.';
           }
});