import * as freecell from "./freecell.js"

Deno.test("create a game", () => {
    const renderer = {
        Render: () => { }
    }
    freecell.Play(renderer)
})
