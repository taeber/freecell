"use strict"

if (typeof require !== "undefined") {
    // deno-lint-ignore no-inner-declarations no-var
    var freecell = require("./freecell.js")
}

// deno-lint-ignore no-var no-unused-vars
var webui = (function () {

    const namedRanks = Object.fromEntries(
        Object.entries(freecell.Ranks).map(a => a.reverse())
    )

    function renderCard(card) {
        const rankText = namedRanks[card.Rank()]
            ? namedRanks[card.Rank()][0]
            : `${card.Rank()}`
        const suitText = freecell.Suits[card.Suit()]
        return `
            <span class="${card.Suit()}">
                ${suitText}${rankText}
            </span>
        `
    }

    function renderCells(cells) {
        return `<div class=cells>${cells.map(renderCell).join('')}</div>`

        function renderCell(cell, index) {
            return !cell.Card()
                ? `<div class="empty cell" data-cell="${index}"></div>`
                : `
                    <div class=cell>
                        <div class=card data-cell="${index}">
                            ${renderCard(cell.Card())}
                        </div>
                    </div>
                `
        }
    }

    function renderFoundations(foundations) {
        // console.debug(RenderFoundations.name, {foundations})
        return `
            <div class=foundations>
                ${foundations.map(renderFoundation).join('')}
            </div>
        `

        function renderFoundation(cards) {
            const top = cards.slice(-1)[0]
            // console.debug(RenderFoundation.name, {cards, top})
            return !top
                ? `<div class="empty foundation"></div>`
                : `<div class=foundation><div class=card>${renderCard(top)}</div></div>`
        }
    }

    function renderCascades(cascades) {
        // console.debug(RenderCascades.name, {cascades})
        return `<ol class="cascades">${cascades.map(render).join('')}</ol>
        `

        function render(cascade, cascadeNum) {
            // console.debug(render.name, {cascade})
            if (cascade.length === 0) {
                return `
                    <ol class="empty cascade" tabindex=0
                        data-cascade="${cascadeNum}" data-index="0"></ol>
                `
            }

            return `
                <ol class=cascade>
                    ${cascade.map(render).join('')}
                </ol>
            `

            function render(card, cardIndex) {
                return `
                    <li class=card tabindex=0
                        data-cascade="${cascadeNum}" data-index="${cardIndex}"
                    >
                        ${renderCard(card)}
                    </li>
                `
            }
        }
    }

    function renderWinner(won, moves) {
        return won
            ? `<div class=winner>You won in ${moves} moves!</div>`
            : ''
            // : `<div class=winner>You won in ${moves} moves!</div>`
    }

    function Renderer(dom, onNextFrame) {
        dom.picked = {}

        return {
            Render: (game) => onNextFrame(() => renderGame(game)),
        }

        function pick(picked) {
            if (dom.picked.cell) {
                dom.picked.cell.classList.remove("picked")
            }
            if (dom.picked.cascade) {
                dom.picked.cascade.classList.remove("picked")
            }
            if (picked && picked.cell) {
                picked.cell.classList.add("picked")
            }
            if (picked && picked.cascade) {
                picked.cascade.classList.add("picked")
            }
            if (picked) {
                dom.picked = picked
                dom.classList.add("picked")
            } else {
                dom.picked = {}
                dom.classList.remove("picked")
            }
        }

        function renderGame(game) {
            const topRow = `
                <div class=top>
                    ${renderFoundations(game.Foundations())}
                    <div class=logo><span>Undo</span></div>
                    ${renderCells(game.Cells())}
                </div>
            `

            dom.innerHTML = [
                topRow,
                renderCascades(game.Cascades()),
                renderWinner(game.Over(), game.MoveCount()),
            ]
                .flatMap(x => x)
                .join("\n")

            const logo = dom.querySelector(".logo")
            logo.onclick = (e) => {
                console.debug("logo.onclick", e)
                game.Undo()
            }

            addOnCellClicks()
            addOnEmptyCellClicks()
            addOnCascadeClicks()
            addOnEmptyCascadeClicks()

            return

            function addOnCellClicks() {
                const cards = dom.querySelectorAll(".cell .card")
                for (const node of cards) {
                    node.onclick = () => {
                        if (node === dom.picked.cell) {
                            if (!game.Automove(node.dataset)) {
                                console.log("No move")
                            } else {
                                pick()
                            }
                        } else {
                            pick({ cell: node })
                        }
                    }
                }
            }

            function addOnEmptyCellClicks() {
                const nodes = dom.querySelectorAll(".cell.empty")
                for (const node of nodes) {
                    node.onclick = () => {
                        if (!dom.picked.cascade) {
                            return
                        }
                        // Move card in another cascade to this cell
                        const src = dom.picked.cascade
                        if (!game.Move(node.dataset, src.dataset)) {
                            console.log("Invalid move")
                        }
                        pick()
                    }
                }
            }

            function addOnCascadeClicks() {
                const cards = dom.querySelectorAll(".cascade .card")
                for (const node of cards) {
                    node.onclick = () => {
                        if (node === dom.picked.cascade) {
                            if (!game.Automove(node.dataset)) {
                                console.log("No move")
                            }
                            pick()
                        } else if (dom.picked.cascade) {
                            // Move card in another cascade to this card
                            const src = dom.picked.cascade
                            if (!game.Move(node.dataset, src.dataset)) {
                                console.log("Invalid move")
                            }
                            pick()
                        } else if (dom.picked.cell) {
                            // Move card in cell to this card
                            const src = dom.picked.cell
                            if (!game.Move(node.dataset, src.dataset)) {
                                console.log("Invalid move")
                            }
                            pick()
                        } else {
                            pick({ cascade: node })
                        }
                    }
                }
            }

            function addOnEmptyCascadeClicks() {
                const nodes = dom.querySelectorAll(".cascade.empty")
                for (const node of nodes) {
                    node.onclick = () => {
                        if (!dom.picked) {
                            return
                        }
                        const src = dom.picked.cascade ? dom.picked.cascade : dom.picked.cell
                        if (!game.Move(node.dataset, src.dataset)) {
                            console.log("Invalid move")
                        }
                        pick()
                    }
                }
            }
        }


    }

    return {
        Renderer,
    }

})()
