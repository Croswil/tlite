# tlite

Utility per la gestione dei files sqlite da CLI. 

Questo tool permette di creare file SQLite, creare tabelle, importare e esportare dati e 
eseguire da linea di comando varie operazioni sui files SQL

installazione 

``` 
npm i -g liburno_tlite
```

per l'utilizzo

```
tlite [nome database]
```

nella console di tlite scrivere `help` per la lista dei comandi

## Problemi con l'installazione in linux come supervisore:

ho riscontrato problemi nella installazione globale di questa libreria, in quanto richiede la compilazione 
di better-sqlite3 che non viene eseguita correttamente in modalità root:

```
sudo npm i -g liburno_tlite
```

in questo caso si puó installare localmente in questo modo

```
npm i -g liburno_tlite
cd node_modules/liburno_tlite
sudo npm link
```

in questo modo, anche se "sporco" digitando da terminale `tlite` in qualsiasi cartella questo risulta collegato e funzionante.

