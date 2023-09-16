import * as freecell from "./freecell.js"

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
                <span class=suit>${suitText}</span>
                <span class=rank>${rankText}</span>
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
        ? `<div class=winner><span>You won in ${moves} moves!</span></div>`
        : ''
}

function Renderer(dom, onNextFrame) {
    dom.picked = {}

    return {
        Render: (game) => onNextFrame(() => renderGame(game)),
    }

    function pick(picked) {
        // console.debug(pick.name, { picked })
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
    function hasPick() { return !!dom.picked.cell || !!dom.picked.cascade }

    function renderGame(game) {
        const topRow = `
                <div class=top>
                    ${renderFoundations(game.Foundations())}
                    <div class=actions>
                        <button class=newgame>New</button>
                        <button class=quick>${dom.quick ? "Quick" : "Pick"}</button>
                        <button class=undo ${game.MoveCount() === 0 ? "disabled" : ""}>Undo</button>
                    </div>
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


        const newgame = dom.querySelector("button.newgame")
        newgame.onclick = () => {
            if (confirm("Are you sure you want to start a new game?")) {
                game.NewGame()
            }
        }

        if (game.Over()) {
            const winner = dom.querySelector(".winner")
            winner.onclick = () => game.NewGame()
        }

        const undo = dom.querySelector("button.undo")
        undo.onclick = (e) => {
            e.preventDefault()
            game.Undo()
        }

        const quick = dom.querySelector("button.quick")
        quick.onclick = () => {
            dom.quick = !dom.quick
            game.Render(game)
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
                    if (node === dom.picked.cell || dom.quick) {
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
                    if (dom.quick) {
                        handle(node, hasPick() ? dom.picked : { cascade: node })
                    } else if (hasPick()) {
                        handle(node, dom.picked)
                    } else {
                        pick({ cascade: node })
                    }
                }
            }

            return

            function handle(node, picked) {
                if (node === picked.cascade) {
                    if (!game.Automove(node.dataset)) {
                        console.log("No move")
                    }
                    pick()
                } else if (picked.cascade) {
                    // Move card in another cascade to this card
                    const src = picked.cascade
                    if (!game.Move(node.dataset, src.dataset)) {
                        console.log("Invalid move")
                    }
                    pick()
                } else if (picked.cell) {
                    // Move card in cell to this card
                    const src = picked.cell
                    if (!game.Move(node.dataset, src.dataset)) {
                        console.log("Invalid move")
                    }
                    pick()
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

export {
    Renderer,
}
