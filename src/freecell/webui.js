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
                ? `<div class="empty cell"></div>`
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
                return `<ol class="empty cascade"></ol>`
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

    function renderGame(game, element) {
        const topRow = `
                <div class=top>
                    ${renderFoundations(game.Foundations())}
                    <div class=logo>FC</div>
                    ${renderCells(game.Cells())}
                </div>
            `

        element.innerHTML = [
            topRow,
            renderCascades(game.Cascades()),
        ]
            .flatMap(x => x)
            .join("\n")

        {
            const cards = element.querySelectorAll(".cell .card")
            for (const dom of cards) {
                dom.onclick = (e) => {
                    console.debug("Card dbl-clicked", e)
                    if (!game.Move(dom.dataset)) {
                        console.log("No move")
                    }
                }
            }
        }

        {
            const cards = element.querySelectorAll(".cascade .card")
            for (const dom of cards) {
                dom.onclick = (e) => {
                    console.debug("Card dbl-clicked", e)
                    if (!game.Move(dom.dataset)) {
                        console.log("No move")
                    }
                }
            }
        }

    }

    function Renderer(element, onNextFrame) {
        return {
            Render,
        }

        function Render(game) {
            onNextFrame(() => renderGame(game, element))
        }
    }

    return {
        Renderer,
    }

})()
