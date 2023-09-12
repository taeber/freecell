"use strict"

// deno-lint-ignore no-var no-unused-vars
var freecell = (function () {

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

    const suitColors = (suit) => {
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

    /** @enum {number} */
    const Ranks = {
        Ace: 1,
        Jack: 11,
        Queen: 12,
        King: 13,
    }

    const peek = (cards) => cards.slice(-1)[0]

    function canPutInCell(cell) {
        if (cell.length > 0) {
            return false
        }
        return true
    }

    function canPutOntoFoundation(foundation, card) {
        const top = peek(foundation)
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
        const top = peek(cascade)
        if (top) {
            if (suitColors(top.Suit()) === suitColors(card.Suit())) {
                return false
            }
            if (top.Rank() !== card.Rank() + 1) {
                return false
            }
        }
        return true
    }

    function Play(renderer) {
        const history = []

        let cells = [[], [], [], []]
        let foundations = [[], [], [], []]
        let cascades = [[], [], [], [], [], [], [], []]

        const game = {
            Cell: (i) => ({
                Put: (card) => putInCell(cells[i], card),
                Card: () => cells[i][0],
            }),
            Cells: () => cells.map((_, i) => game.Cell(i)),
            Foundations: () => foundations,
            Cascades: () => cascades,
            Automove,
            Move,
            MoveCount: () => history.length - 1,
            Over: () => cascades.every(c => c.length === 0),
            Render: renderer.Render,
            Undo,
        }

        distribute()
        snapshot()
        renderer.Render(game)

        return game

        function distribute() {
            const deck = Deck()
            deck.Shuffle()
            // for (let i = 0; i < 4; i++) deck.Take()
            for (let c = 0; !deck.Empty(); c = (c + 1) % cascades.length) {
                cascades[c].push(deck.Take())
            }
        }

        function move(src, card, dests, canPut) {
            for (const dest of dests) {
                if (!canPut(dest, card)) {
                    continue
                }
                snapshot()
                src.pop(card)
                dest.push(card)
                return true
            }
            return false
        }

        function moveFromCell(src) {
            const cell = cells[src.cell]
            const card = peek(cell)
            const put = move.bind(null, cell, card)
            return put(foundations, canPutOntoFoundation) ||
                put(cascades.filter(c => c.length > 0), canPutOntoCascade) ||
                put(cascades.filter(c => c.length === 0), canPutOntoCascade)
        }

        function moveFromCascade(src) {
            const cascade = cascades[src.cascade]
            if (cascade.length - 1 !== parseInt(src.index)) {
                // TODO: improve automatic move
                return false
            }
            const card = peek(cascade)
            const put = move.bind(null, cascade, card)

            return put(foundations, canPutOntoFoundation) ||
                put(cells, canPutInCell) ||
                put(cascades.filter(dest => dest !== cascade), canPutOntoCascade)
        }

        function Automove(src) {
            if (src.cell) {
                if (moveFromCell(src)) {
                    renderer.Render(game)
                    return true
                }
                return false
            } else {
                if (moveFromCascade(src)) {
                    renderer.Render(game)
                    return true
                }
                return false
            }
        }

        function Move(dst, src) {
            console.log(Move.name, {dst, src})
            if (src.cell) {
                const cell = cells[src.cell]
                const card = peek(cell)
                if (!move(cell, card, [cascades[dst.cascade]], canPutOntoCascade)) {
                    return false
                }
                renderer.Render(game)
                return true
            } else {
                const cascade = cascades[src.cascade]
                if (cascade.length - 1 !== parseInt(src.index)) {
                    // TODO: improve automatic move
                    return false
                }
                const card = peek(cascade)
                if (!move(cascade, card, [cascades[dst.cascade]], canPutOntoCascade)) {
                    return false
                }
                renderer.Render(game)
                return true
            }
        }

        function snapshot() {
            history.push({
                cells: [...cells.map(cards => [...cards])],
                foundations: [...foundations.map(cards => [...cards])],
                cascades: [...cascades.map(cards => [...cards])],
            })
        }

        function Undo() {
            if (history.length <= 1) {
                return
            }
            const prev = history.pop()
            cells = prev.cells
            foundations = prev.foundations
            cascades = prev.cascades
            renderer.Render(game)
        }
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

    return {
        Suits,
        Ranks,
        Card,
        Deck,
        Play,
    }

})()