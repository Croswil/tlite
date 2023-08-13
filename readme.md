# tlite

Utility per la gestione dei files sqlite da CLI. 

Questo tool permette di creare file SQLite, creare tabelle, importare e esportare dati e 
eseguire da linea di comando varie operazioni sui files SQL


- aggiunto supporto import export excel 

! select m.rowid id,m.mappa,m.mappa0,m.cod,m.des,m.tipomag,m.vendibile,m.offerta,m.dtfineprenota,m.datasmantellamento,m.ordine,
               m.qt,m.doc,m.amb,m.chiuso,m.ordine,m.doc,m.amb,
               d.des desvendita,d.ana anac2,o.doc doc1,o.amb amb1,
               a.cod codfor,i.cognome || ' ' || i.nome ragsoc,i.citta, i.tel,   
               i2.cognome || ' ' || i2.nome cragsoc,i.citta ccitta, i.tel ctel
               from mag m
               left join ordini o on m.ordine=o.cod
               left join doc d on o.doc=d.cod
               left join ana a on a.rowid=m.ana 
               left join ind i on m.ana=i.ana and i.tip='f' and i.main=1
               left join ind i2 on i2.rowid=d.ana and i.tip='c' and i.main=1

          where (m.cod like ? or m.des like ? or m.mappa like ? or ragsoc like ? or cragsoc like ? ) and m.chiuso=0 and m.tipomag=?  order by m.cod COLLATE NOCASE asc  limit 0,41
["%sheen%","%sheen%","%sheen%","%sheen%","%sheen%","o"]
!