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
        const card = cell.at(-1)
        return !card
            ? `<div class="empty cell" data-cell="${index}"></div>`
            : `
                    <div class=cell>
                        <div class=card data-cell="${index}">
                            ${renderCard(card)}
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
        const top = cards.at(-1)
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
    dom.quick = true
    dom.picked = {}

    return {
        ShowAppInfo: () => dom.querySelector("dialog.appinfo").showModal(),
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
                    <button class=game>Game</button>
                    <button class=quick>${dom.quick ? "Auto" : "Pick"}</button>
                    <button class=undo ${game.MoveCount() === 0 ? "disabled" : ""}>Undo</button>
                </div>
                ${renderCells(game.Cells())}
            </div>
        `

        const appinfoDialog = `
            <dialog class=appinfo>
                <strong>${freecell.AppInfo.Name}</strong>
                <p id="version">Version: ${freecell.AppInfo.Version}</p>
                <p>&copy; ${freecell.AppInfo.Copyright.Year} ${freecell.AppInfo.Copyright.By}</p>
                <p>
                    <a href="${freecell.AppInfo.License.Link}">
                        ${freecell.AppInfo.License.Name}
                    </a>
                </p>
                <p>
                    <a href="${freecell.AppInfo.Link}">${freecell.AppInfo.Link}</a>
                </p>
                <button>Close</button>
            </dialog>
        `

        const gameDialog = `
            <dialog class=game>
                <button class=new>New Game</button>
                <button class=retry>Retry</button>
                <button class=close>Close</button>
            </dialog>
        `

        dom.innerHTML = [
            topRow,
            renderCascades(game.Cascades()),
            renderWinner(game.Over(), game.MoveCount()),
            appinfoDialog,
            gameDialog,
        ]
            .flatMap(x => x)
            .join("\n")

        const showGameDialog = () => {
            const dialog = dom.querySelector("dialog.game")
            dialog.showModal()
            dialog.querySelector("button.new").onclick   = () => game.NewGame()
            dialog.querySelector("button.retry").onclick = () => window.location.reload()
            dialog.querySelector("button.close").onclick = () => dialog.close()
        }

        dom.querySelector("button.game").onclick = showGameDialog
        if (game.Over()) {
            const winner = dom.querySelector(".winner")
            winner.onclick = showGameDialog
        }

        const undo = dom.querySelector("button.undo")
        undo.onclick = (e) => {
            e.preventDefault()
            game.Undo()
            pick()
        }

        const quick = dom.querySelector("button.quick")
        quick.onclick = () => {
            dom.quick = !dom.quick
            game.Render(game)
        }

        const dialog = dom.querySelector("dialog.appinfo")
        dialog.querySelector("button").onclick = () => dialog.close()

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
                            setTimeout(() => tryEasymove(100), 100)
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

        function tryEasymove(delay) {
            if (game.Easymove()) {
                setTimeout(() => tryEasymove(delay - 10), Math.max(delay, 0))
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
                    } else if (node.nextElementSibling) {
                        pick()
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
                    } else {
                        setTimeout(() => tryEasymove(100), 100)
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
