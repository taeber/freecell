/** @enum {string} */
const Suits = {
    Diamonds: '♦',
    Clubs: '♣',
    Hearts: '♥',
    Spades: '♠',
}

/** @enum {string} */
const colors = {
    Red: "Red",
    Black: "Black",
}

const suitColor = (suit) => {
    switch (Suits[suit]) {
        case Suits.Diamonds:
        case Suits.Hearts:
            return colors.Red
        case Suits.Clubs:
        case Suits.Spades:
            return colors.Black
        default:
            return null
    }
}

const oppositeColor = (suit) => {
    switch (Suits[suit]) {
        case Suits.Diamonds:
        case Suits.Hearts:
            return colors.Black
        case Suits.Clubs:
        case Suits.Spades:
            return colors.Red
        default:
            return null
    }
}

/** @enum {number} */
const Ranks = {
    Ace: 1,
    Jack: 11,
    Queen: 12,
    King: 13,
}

function canPutInCell(cell) {
    if (cell.length > 0) {
        return false
    }
    return true
}

function canPutOntoFoundation(foundation, card) {
    const top = foundation.at(-1)
    if (top) {
        if (top.Suit() !== card.Suit() || top.Rank() + 1 !== card.Rank()) {
            return false
        }
    } else if (card.Rank() !== Ranks.Ace) {
        return false
    }
    return true
}

function canPutOntoCascade(cascade, card) {
    const top = cascade.at(-1)
    if (top) {
        if (suitColor(top.Suit()) === suitColor(card.Suit())) {
            return false
        }
        if (top.Rank() !== card.Rank() + 1) {
            return false
        }
    }
    return true
}

function makeGameData() {
    return {
        cells: [[], [], [], []],
        foundations: [[], [], [], []],
        cascades: distribute([[], [], [], [], [], [], [], []]),
    }
}

function makeHistory() {
    const history = []
    return {
        Restore,
        Snapshot,
        Length: () => history.length,
    }

    function Restore(to) {
        if (history.length <= 1) {
            return false
        }
        const prev = history.pop()
        to.cells = prev.cells
        to.foundations = prev.foundations
        to.cascades = prev.cascades
        return true
    }

    function Snapshot(of) {
        const copyCards = (cards) => [...cards]
        const copyStack = (src) => [...src.map(copyCards)]
        history.push({
            cells: copyStack(of.cells),
            foundations: copyStack(of.foundations),
            cascades: copyStack(of.cascades),
        })
    }
}

function distribute(cascades) {
    const deck = Deck()
    deck.Shuffle()
    // for (let i = 0; i < 4; i++) deck.Take()
    for (let c = 0; !deck.Empty(); c = (c + 1) % cascades.length) {
        cascades[c].push(deck.Take())
    }
    return cascades
}

function checkedMove(dst, src, canPut, onMoving) {
    if (!dst || !src) {
        return false
    }

    const card = src.at(-1)
    if (!canPut(dst, card)) {
        return false
    }

    onMoving()
    dst.push(src.pop())
    return true
}

function moveFromCell(data, onMoving, src) {
    const { cells, cascades, foundations } = data

    const cell = cells[src.cell]
    const put = (stacks, canPut) =>
        stacks.some((dst) => checkedMove(dst, cell, canPut, onMoving))

    return put(foundations, canPutOntoFoundation) ||
        put(cascades.filter(c => c.length > 0), canPutOntoCascade) ||
        put(cascades.filter(c => c.length === 0), canPutOntoCascade)
}

function moveFromCascade(data, onMoving, src) {
    const { cells, cascades, foundations } = data

    const cascadeNum = parseInt(src.cascade)
    const cascade = cascades[cascadeNum]
    if (cascade.length - 1 !== parseInt(src.index)) {
        // TODO: improve automatic move
        return false
    }

    const put = (stacks, canPut) =>
        stacks.some((dst) => checkedMove(dst, cascade, canPut, onMoving))

    const cascadesToTheRight =
        cascades.slice(cascadeNum + 1)
            .filter(dest => dest !== cascade)

    return put(foundations, canPutOntoFoundation) ||
        put(cascadesToTheRight.filter(c => c.length > 0), canPutOntoCascade) ||
        put(cells, canPutInCell) ||
        put(cascades.slice(0, cascadeNum), canPutOntoCascade) ||
        put(cascadesToTheRight.filter(c => c.length === 0), canPutOntoCascade)
}

function automove(game, data, history, src) {
    const onMoving = () => history.Snapshot(data)
    if (src.cell) {
        if (!moveFromCell(data, onMoving, src)) {
            return false
        }
    } else if (src.cascade) {
        if (!moveFromCascade(data, onMoving, src)) {
            return false
        }
    } else {
        return false
    }
    game.Render()
    return true
}

function move(game, data, history, dst, src) {
    const { cells, cascades } = data
    const onMoving = () => history.Snapshot(data)
    if (src.cell) {
        const cell = cells[src.cell]
        if (!checkedMove(cascades[dst.cascade], cell, canPutOntoCascade, onMoving)) {
            return false
        }
    } else {
        const cascade = cascades[src.cascade]
        if (cascade.length - 1 !== parseInt(src.index)) {
            // TODO: improve automatic move
            return false
        }
        if (dst.cell) {
            if (!checkedMove(cells[dst.cell], cascade, canPutInCell, onMoving)) {
                return false
            }
        } else if (dst.cascade) {
            if (!checkedMove(cascades[dst.cascade], cascade, canPutOntoCascade, onMoving)) {
                return false
            }
        } else {
            return false
        }
    }
    game.Render()
    return true
}

function Play(renderer) {
    const history = makeHistory()
    const data = makeGameData()
    const game = {
        Cells: () => data.cells,
        Foundations: () => data.foundations,
        Cascades: () => data.cascades,
        MoveCount: () => history.Length() - 1,
        Over: () => [...data.cascades, ...data.cells].every(c => c.length === 0),

        Automove,
        Move: (dst, src) => move(game, data, history, dst, src),
        NewGame: () => Play(renderer),
        Render: () => renderer.Render(game),
        Undo: () => history.Restore(data) && game.Render(),
    }
    history.Snapshot(data)
    game.Render()
    return game

    function Automove(src) {
        if (!automove(game, data, history, src)) {
            return false
        }

        if (easywin(game, data, history)) {
            console.debug("easywin")
        }

        return true
    }
}

function easywin(game, data, history) {
    // altHistory.Snapshot(data)
    // data = {}
    // altHistory.Restore(data)
    // Find min
    function step() {
        const tops = [...data.cells, ...data.cascades]
            .filter(s => s.length > 0)
            .map(s => ({location: s, card: s.at(-1)}))
            .sort((a,b) => a.card.Rank() - b.card.Rank())
        const minRank = tops[0].card.Rank()
        const mins = tops.filter(x => x.card.Rank() === minRank)
        console.debug(easywin.name, {tops, mins})
        // TODO: check to make sure there isn't a card of another color that
        // needs the min. In other words,if there is a lower card of the
        // opposite color still in play, don't move the min card.
        // [r] [b] [r]
        // (3) (2) (2) (0)   <- don't automove the r-3 because b-2 isn't on a foundation
        const minBySuit = {
            Diamonds: 1,
            Clubs: 1,
            Hearts: 1,
            Spades: 1,
        }
        for (const foundation of data.foundations) {
            const top = foundation.at(-1)
            if (!top) {
                continue
            }
            minBySuit[top.Suit()] = top.Rank()
        }
        const minByColor = {
           [colors.Red]: Math.min(minBySuit.Diamonds, minBySuit.Hearts),
           [colors.Black]: Math.min(minBySuit.Clubs, minBySuit.Spades),
        }
        console.debug(minByColor, minBySuit)

        const onMoving = () => history.Snapshot(data)
        for (const min of mins) {
            const opposite = oppositeColor(min.card.Suit())
            if (min.card.Rank() > minByColor[opposite]+1) {
                console.debug("easywin skipped", min.card.Rank(), ">", minByColor[opposite]+1, opposite)
                continue
            }
            for (const foundation of data.foundations) {
                if (checkedMove(foundation, min.location, canPutOntoFoundation, onMoving)) {
                    console.log("easywin move", data)
                    return true
                }
            }
        }
        return false
    }

    function done() {
        return [...data.cascades, ...data.cells].every(c => c.length === 0)
    }

    while (!done()) {
        if (!step()) {
            return false
        }
    }
    return true
}

const Card = function (/** @type Suits */suit, /** @type Ranks */rank) {
    if (rank < Ranks.Ace || rank > Ranks.King) {
        throw new Error(`rank is out of bounds: ${rank}`)
    }
    if (!Suits[suit]) {
        throw new Error(`unknown suit: ${suit}`)
    }
    return {
        Suit: () => suit,
        Rank: () => rank,
    }
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 * @see https://stackoverflow.com/a/6274381
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const Deck = function () {
    const cards = []
    for (const suit in Suits) {
        for (let rank = Ranks.Ace; rank <= Ranks.King; rank++) {
            cards.push(Card(suit, rank))
        }
    }

    return {
        Shuffle: () => shuffle(cards),
        Take: () => cards.shift(),
        Empty: () => cards.length === 0,
    }
}

export {
    Suits,
    Ranks,
    Card,
    Deck,
    Play,
}
