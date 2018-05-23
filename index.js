const vorpal = require('vorpal')();
const chalk = vorpal.chalk;
const pokedex = require('./pokedex.json');
const data = require('./data.json');
var jsonfile = require('jsonfile')

function writeData() {
    var file = './data.json'

    jsonfile.writeFile(file, data)
}

// formatting for a pokemon's pokedex entry
function formatPokedexEntry(entry) {
    let output = `
    ${chalk.red('species')}: ${entry.Name}
    ${chalk.yellow('type')}: ${entry.Type1}   ${chalk.yellow('type 2')}: ${entry.Type2}

    ${chalk.grey('base stats')}:
    -----------
    ${chalk.red('attack')}     : ${entry.Attack}
    ${chalk.red('defense')}    : ${entry.Defense}
    ${chalk.red('sp attack')}  : ${entry['Special Attack']}
    ${chalk.red('sp defense')} : ${entry['Special Defense']}
    ${chalk.red('speed')}      : ${entry.Speed}
    `
    return output;
}

// formatting for an owned pokemon
function formatPokemon(pokemon) {
    let output = `
    ${chalk.red('name')}: ${pokemon.nickname}    ${chalk.red('lv')}: ${pokemon.level}
    ${chalk.yellow('species')}: ${pokemon.Name}
    ${chalk.yellow('type')}: ${pokemon.Type1}    ${chalk.yellow('type 2')}: ${pokemon.Type2}

    ${chalk.grey('base stats')}:
    -----------
    ${chalk.red('attack')}     : ${pokemon.Attack}
    ${chalk.red('defense')}    : ${pokemon.Defense}
    ${chalk.red('sp attack')}  : ${pokemon['Special Attack']}
    ${chalk.red('sp defense')} : ${pokemon['Special Defense']}
    ${chalk.red('speed')}      : ${pokemon.Speed}
    `
    return output;
}

// uses the level and added stats to compute values
function computeStats(pokemon) {

}

vorpal
    .command('pokedex [pokemon]', 'Outputs pokedex entry of pokemon.')
    .action( function(args, callback) {
        if (args.pokemon in pokedex.pokemon) {
            this.log(formatPokedexEntry(pokedex.pokemon[args.pokemon]));
        } else {
            this.log(chalk.yellow("That Pokemon doesn't exist!"));
        }
        callback();
    });

vorpal
    .command('pokemon [number]', 'Outputs your caught pokemon.')
    .action( function(args, callback) {
        if (args.number === undefined) {
            for (let i = 0; i < data.pokemon.length; i++) {
                this.log((i + 1) + '. ' + data.pokemon[i].Name + ' - lv.' + data.pokemon[i].level);
            }
        } else {
            if (args.number <= data.pokemon.length && args.number > 0) {
                this.log(formatPokemon(data.pokemon[parseInt(args.number) - 1]));
            } else {
                this.log(chalk.yellow('Number out of range, make sure you are using the number of a pokemon you own!'));
            }
        }
        
        callback();
    });

vorpal
    .command('catch [pokemon]', 'Prompts to store new caught pokemon.')
    .action( function(args, callback) {
        if (args.pokemon in pokedex.pokemon) {
            const self = this;
            let pokemon = pokedex.pokemon[args.pokemon];
            this.prompt({ type: 'input', name: 'level', message: 'What level is this Pokemon? '})
                .then( function(result) {
                    pokemon.level = result.level
                    ;
                    self.prompt({ type: 'input', name: 'nickname', message: 'Give this Pokemon a nickname? '})
                        .then( function(result) {
                            if (result.nickname === '') {
                                pokemon.nickname = pokemon.Name;
                            } else {
                                pokemon.nickname = result.nickname
                            }

                            self.prompt({ type: 'input', name: 'nature', message: "What is this Pokemon's nature? "})
                                .then( function(result) {

                                    pokemon.nature = result.nature;

                                    self.log(`\n    species: ${pokemon.Name}\n    nickname: ${pokemon.nickname}\n    nature: ${pokemon.nature}\n    level: ${pokemon.level}\n`);
                                    
                                    self.prompt({ type: 'confirm', name: 'submit', message: 'Is this correct? '})
                                        .then( function(result) {
                                            if (result.submit) {
                                                data.pokemon.push(pokemon);
                                                writeData();
                                                self.log(`${pokemon.Name} caught!`)
                                            }
                                            callback();
                                        });
                                });
                        });
                });
        } else {
            this.log(chalk.yellow("That Pokemon doesn't exist!"));
        }
    })

vorpal
    .delimiter(chalk.red('ptu-cli >'))
    .show();