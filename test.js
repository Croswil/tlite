import readline from 'readline';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

// Elenco di comandi per l'autocompletamento
const commands = ['start', 'stop', 'restart', 'status', 'help'];

// Funzione di completamento
function completer(line, callback) {
    const completions = [...commands, ...getFiles('.')];
    const hits = completions.filter((c) => c.startsWith(line));

    if (hits.length === 1) {
        callback(null, [hits, line]);
    } else if (hits.length > 1) {
        inquirer.prompt([{
            type: 'list',
            name: 'completion',
            message: 'Select a completion:',
            choices: hits
        }]).then(answer => {
            // Simula l'input dell'utente con la scelta selezionata
            process.stdout.write(answer.completion);
            rl.prompt(true);
        });
    } else {
        callback(null, [completions, line]);
    }
}

// Funzione per ottenere i file nella directory corrente
function getFiles(dir) {
    return fs.readdirSync(dir).filter(file => {
        return fs.statSync(path.join(dir, file)).isFile();
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: completer
});

rl.setPrompt('> ');
rl.prompt();

rl.on('line', (line) => {
    switch (line.trim()) {
        case 'start':
            console.log('Starting...');
            break;
        case 'stop':
            console.log('Stopping...');
            break;
        case 'restart':
            console.log('Restarting...');
            break;
        case 'status':
            console.log('Status: OK');
            break;
        case 'help':
            console.log('Available commands: start, stop, restart, status, help');
            break;
        default:
            console.log(`Unknown command: '${line.trim()}'`);
            break;
    }
    rl.prompt();
}).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
});
