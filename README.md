# pack1pick1
This Discord Bot was made to practice and discuss first picks in drafts.
It supports every set available on Scryfall.com for Magic: the Gathering.
It supports every set available on swdestinydb.com for Star Wars Destiny.

## Commands
!p1p1 help

!p1p1 about

### Magic: The Gathering
!p1p1 paupercube

!p1p1 {setcode}

!p1p1 ct {id}

### Star Wars Destiny
!p1p1swd {setcode}

## Local development
Create a ".env" file in the root directory and add a line for "discord_token=XXXXX"

## Help out?
Feel free to contact me about features etc.

If you find an issue and can fix it, please send a pull request and i will take a look at it.

### Known bugs
Some sets that include more basic lands or replace basic lands might not work as its real life paper counterpart since there seems to be no reliable source to fetch which sets contain more or replaced basic lands etc. This is being handled set by set as they release for now. If you have reliable sources that say the chances to get anything else than a basic land etc, feel free to provide it and we can implement it.