const vorpal = require('vorpal')();
const chalk = vorpal.chalk;
const pokedex = require('./pokedex.json');
const data = require('./data.json');
var jsonfile = require('jsonfile')

function writeData() {
    var file = './data.json'
    jsonfile.writeFile(file, data)
}

function getHighestStat(stats) {
    return stats.reduce((iMax, current, index, stats) => current > stats[iMax] ? index : iMax, 0);
}

function getOrderedStats(stats) {
    let orderedIndices = [];
    let statCopy = stats.slice(0);
    for(let i = 0; i < 6; i++) {
        let index = getHighestStat(statCopy);
        statCopy[index] = 0;
        orderedIndices.push(index);
    }
    return orderedIndices;
}

function initialSkillLevel(pokemon) {
    let total = parseInt(pokemon.level) + 10; 
    let skillDiv = [.3, .25, .15, .1, .1, .1];
    let upgradeArr = [0, 0, 0, 0, 0, 0]; //hp, attack, defense, spat, spdf, speed
    let orderedStats = getOrderedStats(pokemon.stats);
    let runningTotal = total;
    // divide up stats
    for(let i = 0; i < pokemon.stats.length; i++) {
        let upgrade = Math.floor(total * skillDiv[i])
        console.log('giving index ' + orderedStats[i] + ' - ' + upgrade);
        pokemon.stats[orderedStats[i]] += upgrade;
        runningTotal -= upgrade;
        upgradeArr[orderedStats[i]] += upgrade;
    }
    // add this in loop over other stats
    let j = 0;
    while(runningTotal > 0) {
        pokemon.stats[j] += 1;
        upgradeArr[j] += 1;
        runningTotal -= 1;
        j++;
        if (j >= pokemon.stats.length) {
            j = 0;
        }
    }

    return pokemon;
}

// formatting for a pokemon's pokedex entry
function formatPokedexEntry(entry) {
    let output = `
    ${chalk.red('species')}: ${entry.Name}
    ${chalk.yellow('type')}: ${entry.Type1}   ${chalk.yellow('type 2')}: ${entry.Type2}

    ${chalk.grey('base stats')}:
    -----------
    ${chalk.red('health')}     : ${entry.HP}
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

    ${chalk.red('max HP')}: ${parseInt(pokemon.level) + (parseInt(pokemon.stats[0]) * 3) + 10}

    ${chalk.grey('base stats')}:
    -----------
    ${chalk.red('health')}     : ${pokemon.stats[0]}
    ${chalk.red('attack')}     : ${pokemon.stats[1]}
    ${chalk.red('defense')}    : ${pokemon.stats[2]}
    ${chalk.red('sp attack')}  : ${pokemon.stats[3]}
    ${chalk.red('sp defense')} : ${pokemon.stats[4]}
    ${chalk.red('speed')}      : ${pokemon.stats[5]}
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
                                                // Set up their running stats using base
                                                pokemon.stats = [
                                                    parseInt(pokemon.HP),
                                                    parseInt(pokemon.Attack),
                                                    parseInt(pokemon.Defense),
                                                    parseInt(pokemon['Special Attack']),
                                                    parseInt(pokemon['Special Defense']),
                                                    parseInt(pokemon.Speed)
                                                ]
                                                initialSkillLevel(pokemon);
                                                self.log(pokemon.stats);
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