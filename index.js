const vorpal = require('vorpal')();
const chalk = vorpal.chalk;
const pokedex = require('./pokedex.json');
const data = require('./data.json');
var jsonfile = require('jsonfile');

function writeData() {
    var file = './data.json';
    jsonfile.writeFile(file, data);
}

function formatPokemonName(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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

function addNature(pokemon) {
    let nature = pokedex.natures[pokemon.nature];
    pokemon.stats[0] += parseInt(nature.HP);
    pokemon.stats[1] += parseInt(nature.ATK);
    pokemon.stats[2] += parseInt(nature.DEF);
    pokemon.stats[3] += parseInt(nature.SATK);
    pokemon.stats[4] += parseInt(nature.SDEF);
    pokemon.stats[5] += parseInt(nature.SPD);
}

function initialSkillLevel(pokemon) {
    let total = parseInt(pokemon.level) + 10; 
    let skillDiv = [.3, .25, .15, .1, .1, .1];
    let upgradeArr = [0, 0, 0, 0, 0, 0]; //hp, attack, defense, spat, spdf, speed
    let orderedStats = getOrderedStats(pokemon.stats);
    let runningTotal = total;
    // divide up stats
    for(let i = 0; i < pokemon.stats.length; i++) {
        let upgrade = Math.floor(total * skillDiv[i]);
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
    ${chalk.blue('species')}: ${entry.Name}
    ${chalk.yellow('type')}: ${entry.Type1}   ${chalk.yellow('type 2')}: ${entry.Type2}

    ${chalk.grey('base stats')}:
    -----------
    ${chalk.blue('health')}     : ${entry.HP}
    ${chalk.blue('attack')}     : ${entry.Attack}
    ${chalk.blue('defense')}    : ${entry.Defense}
    ${chalk.blue('sp attack')}  : ${entry['Special Attack']}
    ${chalk.blue('sp defense')} : ${entry['Special Defense']}
    ${chalk.blue('speed')}      : ${entry.Speed}
    `
    return output;
}

// formatting for an owned pokemon
function formatPokemon(pokemon) {
    let maxHealth = parseInt(pokemon.level) + (parseInt(pokemon.stats[0]) * 3) + 10;
    let output = `
    ${chalk.blue('name')}: ${pokemon.nickname}    ${chalk.blue('lv')}: ${pokemon.level}
    -----------
    ${chalk.blue('species')}: ${pokemon.Name}    ${chalk.blue('nature')}: ${pokemon.nature}
    ${chalk.yellow('type')}: ${pokemon.Type1}    ${chalk.yellow('type 2')}: ${pokemon.Type2}

    ${chalk.blue('max HP')}: ${maxHealth}    ${chalk.blue('tick')}: ${Math.floor(maxHealth % 10)}

    ${chalk.grey('base stats')}:
    -----------
    ${chalk.blue('health')}     : ${pokemon.stats[0]}
    ${chalk.blue('attack')}     : ${pokemon.stats[1]}
    ${chalk.blue('defense')}    : ${pokemon.stats[2]}
    ${chalk.blue('sp attack')}  : ${pokemon.stats[3]}
    ${chalk.blue('sp defense')} : ${pokemon.stats[4]}
    ${chalk.blue('speed')}      : ${pokemon.stats[5]}
    `
    return output;
}

vorpal
    .command('pokedex [pokemon]', 'Outputs pokedex entry of pokemon.')
    .action( function(args, callback) {
        let pokemon = formatPokemonName(args.pokemon);
        if (pokemon in pokedex.pokemon) {
            this.log(formatPokedexEntry(pokedex.pokemon[pokemon]));
        } else {
            this.log(chalk.yellow("That Pokemon doesn't exist!"));
        }
        callback();
    });

vorpal
    .command('pokemon [number]', 'Outputs your caught pokemon.')
    .action( function(args, callback) {
        if (args.number === undefined) {
            if (data.pokemon.length === 0) {
                this.log(chalk.yellow("\n    You don't have any Pokemon!\n"));
            } else {
                for (let i = 0; i < data.pokemon.length; i++) {
                    this.log((i + 1) + '. ' + data.pokemon[i].Name + ' - lv.' + data.pokemon[i].level);
                }
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
    .command('levelup [number]', 'Use when leveling one of your pokemon.')
    .action( function(args, callback) {
        if (args.number <= data.pokemon.length && args.number > 0) {
            let pokemon = data.pokemon[args.number - 1];
            const self = this;
            const choices = ['hp', 'attack', 'defense', 'special attack', 'special defense', 'speed'];
            this.prompt({ type: 'list', name: 'stat', message: 'What stat do you want to upgrade?', choices: choices})
                .then( function(result) {
                    let index = choices.indexOf(result.stat);
                    pokemon.level++;
                    pokemon.stats[index]++;
                    self.log(`\n   ${chalk.blue(pokemon.nickname)} is now level ${chalk.blue(pokemon.level)}!\n`);
                    writeData();
                    callback();
                })
        } else {
            this.log(chalk.yellow('Number out of range, make sure you are using the number of a pokemon you own!'));
            callback();
        }
        
    });

vorpal
    .command('catch [pokemon]', 'Prompts to store new caught pokemon.')
    .action( function(args, callback) {
        let pName = formatPokemonName(args.pokemon);
        if (pName in pokedex.pokemon) {
            const self = this;
            let pokemon = Object.assign({}, pokedex.pokemon[pName]);
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
                                    if (result.nature in pokedex.natures) {
                                        pokemon.nature = result.nature;
                                    } else {
                                        self.log(chalk.yellow("That's not a valid nature!"));
                                        callback();
                                    }

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
                                                addNature(pokemon);
                                                initialSkillLevel(pokemon);
                                                // Save the caught pokemon
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